'use strict';

var debug = require('debug')('ali-oss:multipart');
var fs = require('fs');
var is = require('is-type-of');
var destroy = require('destroy');
var eoe = require('end-or-error');
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

    var ret = yield this.putStream(name, stream, options);
    if (options && options.progress) {
      yield options.progress(1);
    }

    return ret;
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error('partSize must not be smaller than ' + minPartSize);
  }

  var result = yield this._initMultipartUpload(name, options);
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
      yield options.progress(doneParts.length / numParts, checkpoint);
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
        throw new Error(
          'Failed to upload some parts with error: ' + results[i].error.toString());
      }
    }
  }

  return yield this._completeMultipartUpload(name, uploadId, doneParts, options);
};

/**
 * List the on-going multipart uploads
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
proto.listUploads = function* listUploads(query, options) {
  options = options || {};
  options.subres = 'uploads';
  var params = this._objectRequestParams('GET', '', options)
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);
  var uploads = result.data.Upload || [];
  if (!Array.isArray(uploads)) {
    uploads = [uploads];
  }
  uploads = uploads.map(function (up) {
    return {
      name: up.Key,
      uploadId: up.UploadId,
      initiated: up.Initiated
    };
  });

  return {
    res: result.res,
    uploads: uploads,
    bucket: result.data.Bucket,
    nextKeyMarker: result.data.NextKeyMarker,
    nextUploadIdMarker: result.data.NextUploadIdMarker,
    isTruncated: result.data.IsTruncated === 'true'
  };
};

/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
proto.abortMultipartUpload = function* abortMultipartUpload(name, uploadId, options) {
  options = options || {};
  options.subres = {uploadId: uploadId};
  var params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];

  var result = yield this.request(params);

  return {
    res: result.res
  };
};

/**
 * Initiate a multipart upload transaction
 * @param {String} name the object name
 * @param {Object} options
 * @return {String} upload id
 */
proto._initMultipartUpload = function* _initMultipartUpload(name, options) {
  options = options || {};
  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  options.subres = 'uploads';
  var params = this._objectRequestParams('POST', name, options);
  params.mime = options.mime;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    res: result.res,
    bucket: result.data.Bucket,
    name: result.data.Key,
    uploadId: result.data.UploadId
  };
};

/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
proto._uploadPart = function* _uploadPart(name, uploadId, partNo, data, options) {
  options = options || {};
  options.headers = {
    'Content-Length': data.size
  };

  options.subres = {
    partNumber: partNo,
    uploadId: uploadId
  };
  var params = this._objectRequestParams('PUT', name, options);
  params.mime = options.mime;
  params.stream = data.stream;
  params.successStatuses = [200];

  var result = yield this.request(params);

  data.stream = null;
  params.stream = null;
  return {
    name: name,
    etag: result.res.headers.etag,
    res: result.res
  };
};

/**
 * Complete a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Array} parts the uploaded parts
 * @param {Object} options
 */
proto._completeMultipartUpload = function* _completeMultipartUpload(name, uploadId, parts, options) {
  parts.sort((a, b) => a.number - b.number);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CompleteMultipartUpload>\n';
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    xml += '<Part>\n';
    xml += '<PartNumber>' + p.number + '</PartNumber>\n';
    xml += '<ETag>' + p.etag + '</ETag>\n';
    xml += '</Part>\n';
  }
  xml += '</CompleteMultipartUpload>';

  options = options || {};
  options.subres = {uploadId: uploadId};
  var params = this._objectRequestParams('POST', name, options);
  params.mime = 'xml';
  params.content = xml;
  if (!(options.headers && options.headers['x-oss-callback'])) {
    params.xmlResponse = true;
  }
  params.successStatuses = [200];
  var result = yield this.request(params);

  var ret = {
    res: result.res,
    bucket: params.bucket,
    name: name,
    etag: result.res.headers['etag']
  };

  if (options.headers && options.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
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
