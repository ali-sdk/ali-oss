'use strict';

var debug = require('debug')('ali-oss:multipart');
var fs = require('fs');
var is = require('is-type-of');
var util = require('util');
var path = require('path');
var mime = require('mime');
var gather = require('co-gather');

var proto = exports;

/**
 * Multipart operations
 */

/**
 * Upload a file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File} file
 * @param {Object} options
 *         {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *         {String} options.callback.url  the OSS sends a callback request to this URL
 *         {String} options.callback.host  The host header value for initiating callback requests
 *         {String} options.callback.body  The value of the request body when a callback is initiated
 *         {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *         {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                   customValue = {
 *                     key1: 'value1',
 *                     key2: 'value2'
 *                   }
 */
proto.multipartUpload = function* multipartUpload(name, file, options) {
  options = options || {};
  if (options.checkpoint && options.checkpoint.uploadId) {
    return yield this._resumeMultipart(options.checkpoint, options);
  }

  var minPartSize = 100 * 1024;
  var filename = is.file(file) ? file.name : file;
  options.mime = options.mime || mime.lookup(path.extname(filename));
  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  var fileSize = yield this._getFileSize(file);
  if (fileSize < minPartSize) {
    var stream = this._createStream(file, 0, fileSize);
    options.contentLength = fileSize;

    var result = yield this.putStream(name, stream, options);
    if (options && options.progress) {
      yield options.progress(1);
    }

    var ret =  {
      res: result.res,
      bucket: this.options.bucket,
      name: name,
      etag: result.res.headers.etag
    };

    if (options.headers && options.headers['x-oss-callback']) {
      ret.data = result.data;
    }

    return ret;
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error('partSize must not be smaller than ' + minPartSize);
  }

  var result = yield this.initMultipartUpload(name, options);
  var uploadId = result.uploadId;
  var partSize = this._getPartSize(fileSize, options.partSize);

  var checkpoint = {
    file: file,
    name: name,
    fileSize: fileSize,
    partSize: partSize,
    uploadId: uploadId,
    doneParts: []
  };

  if (options && options.progress) {
    yield options.progress(0, checkpoint, result.res);
  }

  return yield this._resumeMultipart(checkpoint, options);
};

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
proto._resumeMultipart = function* _resumeMultipart(checkpoint, options) {
  var file = checkpoint.file;
  var fileSize = checkpoint.fileSize;
  var partSize = checkpoint.partSize;
  var uploadId = checkpoint.uploadId;
  var doneParts = checkpoint.doneParts;
  var name = checkpoint.name;

  var partOffs = this._divideParts(fileSize, partSize);
  var numParts = partOffs.length;

  var uploadPartJob = function* (self, partNo) {
    var pi = partOffs[partNo - 1];
    var data = {
      stream: self._createStream(file, pi.start, pi.end),
      size: pi.end - pi.start
    };

    var result = yield self._uploadPart(name, uploadId, partNo, data);
    doneParts.push({
      number: partNo,
      etag: result.res.headers.etag
    });
    checkpoint.doneParts = doneParts;

    if (options && options.progress) {
      yield options.progress(doneParts.length / numParts, checkpoint, result.res);
    }
  };

  var all = Array.from(new Array(numParts), (x, i) => i + 1);
  var done = doneParts.map(p => p.number);
  var todo = all.filter(p => done.indexOf(p) < 0);

  if (this.checkBrowserAndVersion('Internet Explorer', '10')) {
    for (var i = 0; i < todo.length; i++) {
      yield uploadPartJob(this, todo[i]);
    }
  } else {
    // upload in parallel
    var jobs = [];
    for (var i = 0; i < todo.length; i++) {
      jobs.push(uploadPartJob(this, todo[i]));
    }
    const defaultParallel = 5;
    var parallel = options.parallel || defaultParallel;
    var results = yield gather(jobs, parallel);

    // check errors after all jobs are completed
    for (var i = 0; i < results.length; i++) {
      if (results[i].isError) {
          var error = results[i].error;
          error.partNum = i;
          error.message = 'Failed to upload some parts with error: ' + results[i].error.toString() + " part_num: "+ i;
          throw error;
      }
    }
  }

  return yield this.completeMultipartUpload(name, uploadId, doneParts, options);
};


is.file = function (file) {
  return typeof(File) !== 'undefined' && file instanceof File;
};

/**
 * Get file size
 */
proto._getFileSize = function* _getFileSize(file) {
  if (is.buffer(file)) {
    return file.length;
  } else if (is.file(file)) {
    return file.size;
  } if (is.string(file)) {
    var stat = yield this._statFile(file);
    return stat.size;
  }

  throw new Error('_getFileSize requires Buffer/File/String.');
};

/*
 * Readable stream for Web File
 */
var Readable = require('stream').Readable;

function WebFileReadStream(file, options) {
  if (!(this instanceof WebFileReadStream)) {
    return new WebFileReadStream(file, options);
  }

  Readable.call(this, options);

  this.file = file;
  this.reader = new FileReader();
  this.start = 0;
  this.finish = false;
  this.fileBuffer;
};
util.inherits(WebFileReadStream, Readable);

WebFileReadStream.prototype.readFileAndPush = function readFileAndPush(size) {
  if (this.fileBuffer){
    var pushRet = true;
    while (pushRet && this.fileBuffer && this.start < this.fileBuffer.length) {
      var start = this.start;
      var end = start + size;
      end = end > this.fileBuffer.length ? this.fileBuffer.length : end;
      this.start = end;
      pushRet = this.push(this.fileBuffer.slice(start, end));
    }
  }
}

WebFileReadStream.prototype._read = function _read(size) {
  if ((this.file && this.start >= this.file.size) || 
      (this.fileBuffer && this.start >= this.fileBuffer.length) ||
      (this.finish) || (0 == this.start && !this.file)) {
    if (!this.finish) {
      this.fileBuffer = null;
      this.finish = true;
    }
    this.push(null);
    return;
  }

  var defaultReadSize = 16 * 1024;
  size = size ? size : defaultReadSize;

  var that = this;
  this.reader.onload = function (e) {
    that.fileBuffer = new Buffer(new Uint8Array(e.target.result));
    that.file = null;
    that.readFileAndPush(size);
  };

  if (0 == this.start) {
    this.reader.readAsArrayBuffer(this.file);
  } else {
    this.readFileAndPush(size);
  }
};

proto._createStream = function _createStream(file, start, end) {
  if (is.file(file)) {
    return new WebFileReadStream(file.slice(start, end));
  } else if (is.string(file)) {
    return fs.createReadStream(file, {
      start: start,
      end: end - 1
    });
  } else {
    throw new Error('_createStream requires File/String.');
  }
};

proto._getPartSize = function _getPartSize(fileSize, partSize) {
  var maxNumParts = 10 * 1000;
  var defaultPartSize = 1 * 1024 * 1024;

  if (!partSize) {
    return defaultPartSize;
  }

  return Math.max(
    Math.ceil(fileSize / maxNumParts),
    partSize
  );
};

proto._divideParts = function _divideParts(fileSize, partSize) {
  var numParts = Math.ceil(fileSize / partSize);

  var partOffs = [];
  for (var i = 0; i < numParts; i++) {
    var start = partSize * i;
    var end = Math.min(start + partSize, fileSize);

    partOffs.push({
      start: start,
      end: end
    });
  }

  return partOffs;
};
