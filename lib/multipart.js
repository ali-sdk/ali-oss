/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (https://github.com/rockuw)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('ali-oss:multipart');
var fs = require('fs');
var is = require('is-type-of');
var destroy = require('destroy');
var eoe = require('end-or-error');
var util = require('util');
var path = require('path');
var mime = require('mime');

var proto = exports;

/**
 * Multipart operations
 */

/**
 * Upload an file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File} file
 * @param {Object} options
 */
proto.multipartUpload = function* (name, file, options) {
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
    doneParts: [],
    nextPart: 0
  };

  return yield this._resumeMultipart(checkpoint, options);
};

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
proto._resumeMultipart = function* (checkpoint, options) {
  var file = checkpoint.file;
  var fileSize = checkpoint.fileSize;
  var partSize = checkpoint.partSize;
  var uploadId = checkpoint.uploadId;
  var doneParts = checkpoint.doneParts;
  var nextPart = checkpoint.nextPart;
  var name = checkpoint.name;

  var partDatas = this._divideParts(file, fileSize, partSize);
  var numParts = partDatas.length;
  for (var i = nextPart; i < numParts; i++) {
    var partNo = i + 1;
    var result = yield this._uploadPart(name, uploadId, partNo, partDatas[i]);
    doneParts.push({
      number: partNo,
      etag: result.res.headers.etag
    });
    checkpoint.nextPart = i + 1;

    if (options && options.progress) {
      yield options.progress(partNo / numParts, checkpoint);
    }
  }

  return yield this._completeMultipartUpload(name, uploadId, doneParts, options);
};

/**
 * List the on-going multipart uploads
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
proto.listUploads = function* (query, options) {
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
proto.abortMultipartUpload = function* (name, uploadId, options) {
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
proto._initMultipartUpload = function* (name, options) {
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
proto._uploadPart = function* (name, uploadId, partNo, data) {
  var options = {};
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
proto._completeMultipartUpload = function* (name, uploadId, parts, options) {
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
proto._getFileSize = function* (file) {
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
  this.reader = null;
};
util.inherits(WebFileReadStream, Readable);

WebFileReadStream.prototype._read = function () {
  if (!this.reader) {
    var that = this;
    that.reader = new FileReader();
    that.reader.onload = function (e) {
      that.push(new Buffer(new Uint8Array(e.target.result)));
      that.push(null);
    };
    that.reader.readAsArrayBuffer(that.file);
  }
};

proto._createStream = function (file, start, end) {
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

proto._getPartSize = function (fileSize, partSize) {
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

proto._divideParts = function (file, fileSize, partSize) {
  var numParts = Math.ceil(fileSize / partSize);

  var partDatas = [];
  for (var i = 0; i < numParts; i++) {
    var start = partSize * i;
    var end = Math.min(start + partSize, fileSize);

    partDatas.push({
      stream: this._createStream(file, start, end),
      size: end - start
    });
  }

  return partDatas;
};
