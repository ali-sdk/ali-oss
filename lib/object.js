/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('ali-oss:object');
var utility = require('utility');
var crypto = require('crypto');
var fs = require('fs');
var is = require('is-type-of');
var destroy = require('destroy');
var eoe = require('end-or-error');
var urlutil = require('url');
var util = require('util');

var proto = exports;

/**
 * Object operations
 */

proto.put = function* (name, file, options) {
  if (is.readableStream(file)) {
    return yield this.putStream(name, file, options);
  }

  options = options || {};
  var data = yield* this._getContent(file);

  options.headers = options.headers || {};
  convertMetaToHeaders(options.meta, options.headers);

  if (!options.headers['Content-Length']) {
    if (data.size === null) {
      throw new TypeError('streaming upload must given the `Content-Length` header');
    }
    options.headers['Content-Length'] = data.size;
  }

  var params = this._objectRequestParams('PUT', name, null, options);
  params.mime = options.mime;
  params.stream = data.stream;
  params.content = data.content;
  params.successStatuses = [200];

  var result = yield* this.request(params);

  return {
    name: name,
    url: this._objectUrl(name),
    res: result.res,
  };
};

proto.putStream = function* (name, stream, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers['Transfer-Encoding'] = 'chunked';
  convertMetaToHeaders(options.meta, options.headers);
  var params = this._objectRequestParams('PUT', name, null, options);
  params.mime = options.mime;

  params.stream = stream;

  params.successStatuses = [200];

  var result = yield* this.request(params);

  return {
    name: name,
    url: this._objectUrl(name),
    res: result.res,
  };
};

proto.head = function* (name, options) {
  var params = this._objectRequestParams('HEAD', name, null, options);
  params.successStatuses = [200, 304];

  var result = yield* this.request(params);

  var data = {
    meta: null,
    res: result.res,
    status: result.status
  };

  if (result.status === 200) {
    for (var k in result.headers) {
      if (k.indexOf('x-oss-meta-') === 0) {
	if (!data.meta) {
	  data.meta = {};
	}
	data.meta[k.substring(11)] = result.headers[k];
      }
    }
  }
  return data;
};

proto.get = function* (name, file, options) {
  var writeStream = null;
  var needDestroy = false;

  if (is.writableStream(file)) {
    writeStream = file;
  } else if (is.string(file)) {
    writeStream = fs.createWriteStream(file);
    needDestroy = true;
  } else {
    // get(name, options)
    options = file;
  }

  options = options || {};
  var result;
  try {
    var params = this._objectRequestParams('GET', name, null, options);
    params.writeStream = writeStream;
    params.successStatuses = [200, 206, 304];

    result = yield* this.request(params);

    if (needDestroy) {
      writeStream.destroy();
    }
  } catch (err) {
    if (needDestroy) {
      writeStream.destroy();
      // should delete the exists file before throw error
      debug('get error: %s, delete the exists file %s', err, file);
      yield deleteFileSafe(file);
    }
    throw err;
  }

  return {
    res: result.res,
    content: result.data
  };
};

proto.getStream = function* (name, options) {
  options = options || {};
  var params = this._objectRequestParams('GET', name, null, options);
  params.customResponse = true;
  params.successStatuses = [200, 206, 304];

  var result = yield* this.request(params);

  return {
    stream: result.res,
    res: {
      status: result.status,
      headers: result.headers
    }
  };
};

proto.delete = function* (name, options) {
  var params = this._objectRequestParams('DELETE', name, null, options);
  params.successStatuses = [204];

  var result = yield* this.request(params);

  return {
    res: result.res
  };
};

proto.deleteMulti = function* (names, options) {
  options = options || {};
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Delete>\n';
  if (options.quiet) {
    xml += '  <Quiet>true</Quiet>\n';
  } else {
    xml += '  <Quiet>false</Quiet>\n';
  }
  for (var i = 0; i < names.length; i++) {
    xml += '  <Object><Key>' + this._objectName(names[i]) + '</Key></Object>\n';
  }
  xml += '</Delete>';
  debug('delete multi objects: %s', xml);

  var params = this._objectRequestParams('POST', '', {delete: ''}, options);
  params.mime = 'xml';
  params.content = xml;
  params.xmlResponse = true;
  params.successStatuses = [200];
  var result = yield* this.request(params);

  var r = result.data;
  var deleted = r && r.Deleted || null;
  if (deleted) {
    if (!Array.isArray(deleted)) {
      deleted = [deleted];
    }
    deleted = deleted.map(function (item) {
      return item.Key;
    });
  }
  return {
    res: result.res,
    deleted: deleted
  };
};

proto.copy = function* (name, sourceName, options) {
  options = options || {};
  options.headers = options.headers || {};
  for (var k in options.headers) {
    options.headers['x-oss-copy-source-' + k.toLowerCase()] = options.headers[k];
  }

  if (options.meta) {
    options.headers['x-oss-metadata-directive'] = 'REPLACE';
  }
  convertMetaToHeaders(options.meta, options.headers);

  if (sourceName[0] !== '/') {
    // copy same bucket object
    sourceName = '/' + this.options.bucket + '/' + sourceName;
  }
  options.headers['x-oss-copy-source'] = sourceName;

  var params = this._objectRequestParams('PUT', name, null, options);
  params.xmlResponse = true;
  params.successStatuses = [200, 304];

  var result = yield* this.request(params);

  var data = result.data;
  if (data) {
    data = {
      etag: data.ETag,
      lastModified: data.LastModified,
    };
  }

  return {
    data: data,
    res: result.res
  };
};

proto.putMeta = function* (name, meta, options) {
  return yield this.copy(name, name, {
    meta: meta || {},
    timeout: options && options.timeout
  });
};

proto.list = function* (query, options) {
  // prefix, marker, max-keys, delimiter

  var params = this._objectRequestParams('GET', '', null, options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);
  var objects = result.data.Contents;
  var that = this;
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(function (obj) {
      return {
	name: obj.Key,
	url: that._objectUrl(obj.Key),
	lastModified: obj.LastModified,
	etag: obj.ETag,
	type: obj.Type,
	size: Number(obj.Size),
	storageClass: obj.StorageClass,
	owner: {
	  id: obj.Owner.ID,
	  displayName: obj.Owner.DisplayName,
	}
      };
    });
  }
  var prefixes = result.data.CommonPrefixes || null;
  if (prefixes) {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes];
    }
    prefixes = prefixes.map(function (item) {
      return item.Prefix;
    });
  }
  return {
    res: result.res,
    objects: objects,
    prefixes: prefixes,
    nextMarker: result.data.NextMarker || null,
    isTruncated: result.data.IsTruncated === 'true'
  };
};

proto.signatureUrl = function (name) {
  name = this._objectName(name);
  var options = this.options;
  var params = {
    bucket: this.options.bucket,
    object: name
  };
  var expires = utility.timestamp() + 1800;
  var stringToSign = [
    'GET',
    '', // Content-MD5
    '', // Content-Type
    expires,
    this._getResource(params)
  ].join('\n');
  var signature = this.signature(stringToSign);

  var url = urlutil.parse(this._getReqUrl(params));
  url.query = {
    OSSAccessKeyId: options.accessKeyId,
    Expires: expires,
    Signature: signature
  };

  return url.format();
};

/**
 * Upload an file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File} file
 * @param {Object} options
 */
proto.multipartUpload = function* (name, file, options) {
  var minSize = 100 * 1024;
  var maxNumParts = 10 * 1000;
  var defaultPartSize = 1 * 1024 * 1024;

  var size = yield* this._getFileSize(file);
  if (size < minSize) {
    return yield* this.put(name, file, options);
  }

  options = options || {};
  options.headers = options.headers || {};
  convertMetaToHeaders(options.meta, options.headers);

  var result = yield* this._initMultipartUpload(name, options);
  var uploadId = result.uploadId;

  var partSize = options.partSize || defaultPartSize;
  var partDatas = this._divideParts(file, size, partSize);
  var numParts = partDatas.length;
  var parts = [];
  for (var i = 0; i < numParts; i++) {
    var partNo = i + 1;
    var result = yield* this._uploadPart(
      name, uploadId, partNo, partDatas[i], options);
    parts.push({
      number: partNo,
      etag: result.res.headers.etag
    });
  }

  return yield* this._completeMultipartUpload(name, uploadId, parts, options);
};

/**
 * List the on-going multipart uploads
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
proto.listUploads = function* (query, options) {
  var params = this._objectRequestParams('GET', '', {uploads: ''}, options)
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
  var params = this._objectRequestParams('DELETE', name, {uploadId, uploadId}, options);
  params.successStatuses = [204];

  var result = yield* this.request(params);

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
  convertMetaToHeaders(options.meta, options.headers);

  var params = this._objectRequestParams('POST', name, {uploads: ''}, options);
  params.mime = options.mime;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield* this.request(params);

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
proto._uploadPart = function* (name, uploadId, partNo, data, options) {
  // TODO: handle stream
  if (!options.headers['Content-Length']) {
    if (data.size === null) {
      throw new TypeError('streaming upload must given the `Content-Length` header');
    }
    options.headers['Content-Length'] = data.size;
  }

  var params = this._objectRequestParams(
    'PUT', name, {partNumber: partNo, uploadId: uploadId}, options);
  params.mime = options.mime;
  params.stream = data.stream;
  params.successStatuses = [200];

  var result = yield* this.request(params);

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

  var params = this._objectRequestParams('POST', name, {uploadId: uploadId}, options);
  params.mime = 'xml';
  params.content = xml;
  params.xmlResponse = true;
  params.successStatuses = [200];
  var result = yield* this.request(params);

  return {
    res: result.res,
    bucket: result.data.Bucket,
    name: result.data.Key,
    etag: result.data.ETag
  };
};

proto._objectUrl = function (name) {
  return this._getReqUrl({bucket: this.options.bucket, object: name});
};

is.file = function (file) {
  return file.constructor.name === 'File';
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
    var stat = yield statFile(file);
    return stat.size;
  }

  throw new Error('_getFileSize requires Buffer/File/String.');
};

/**
 * get content from string(file path), buffer(file content), stream(file stream)
 * @param {Mix} file
 * @return {Buffer}
 *
 * @api private
 */

proto._getContent = function* (file) {
  if (is.buffer(file)) {
    return {
      content: file,
      size: file.length,
    };
  }

  var content = {
    stream: null,
    size: null
  };

  if (is.string(file)) {
    file = fs.createReadStream(file);
    eoe(file, function () {
      destroy(file);
    });
    content.size = yield* this._getFileSize(file);
  }

  if (!is.readableStream(file)) {
    throw new TypeError('upload file type error, support: localfile, Buffer and ReadStream');
  }

  content.stream = file;
  return content;
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
    reader.onload = function (e) {
      that.push(new Buffer(e.target.result, 'binary'));
      that.push(null);
    };
    that.reader.readAsBinaryString(that.file);
  }
};

proto._createStream = function (file, start, end) {
  if (is.file(file)) {
    return new WebFileReadStream(file.slice(start, end));
  } else if (is.string(file)) {
    return fs.createReadStream(file, {start: start, end: end});
  } else {
    throw new Error('_createStream requires File/String.');
  }
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

/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

proto._objectRequestParams = function (method, name, subres, options) {
  if (!this.options.bucket) {
    throw new Error('Please create a bucket first');
  }

  options = options || {};
  name = this._objectName(name);
  var params = {
    object: name,
    bucket: this.options.bucket,
    method: method,
    subres: subres,
    timeout: options.timeout
  };

  if (options.headers) {
    params.headers = options.headers;
  }
  return params;
};

proto._objectName = function (name) {
  return name.replace(/^\/+/, '');
};

function convertMetaToHeaders(meta, headers) {
  if (!meta) {
    return;
  }

  for (var k in meta) {
    headers['x-oss-meta-' + k] = meta[k];
  }
}

function statFile(filepath) {
  return function (callback) {
    fs.stat(filepath, callback);
  };
}

function deleteFileSafe(filepath) {
  return function (callback) {
    fs.exists(filepath, function (exists) {
      if (!exists) {
	return callback();
      }
      fs.unlink(filepath, function (err) {
	if (err) {
	  debug('unlink %j error: %s', filepath, err);
	}
	callback();
      });
    });
  };
}
