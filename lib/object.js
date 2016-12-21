'use strict';

var debug = require('debug')('ali-oss:object');
var utility = require('utility');
var crypto = require('crypto');
var fs = require('fs');
var is = require('is-type-of');
var destroy = require('destroy');
var eoe = require('end-or-error');
var urlutil = require('url');
var copy = require('copy-to');
var querystring = require('querystring');
var path = require('path');
var mime = require('mime');

var proto = exports;

/**
 * Object operations
 */

/**
 * put an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 * @return {Object}
 */
proto.put = function* put(name, file, options) {
  var content;

  options = options || {};
  if (is.buffer(file)) {
    content = file;
  } else if (is.string(file)) {
    options.mime = options.mime || mime.lookup(path.extname(file));
    var stream = fs.createReadStream(file);
    options.contentLength = yield this._getFileSize(file);
    return yield this.putStream(name, stream, options);
  } else if (is.readableStream(file)) {
    return yield this.putStream(name, file, options);
  } else {
    throw new TypeError('Must provide String/Buffer/ReadableStream for put.');
  }

  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  var params = this._objectRequestParams('PUT', name, options);
  params.mime = options.mime;
  params.content = content;
  params.successStatuses = [200];

  var result = yield this.request(params);

  var ret = {
    name: name,
    url: this._objectUrl(name),
    res: result.res,
  };

  if (options.headers && options.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
};

/**
 * put an object from ReadableStream. If `options.contentLength` is
 * not provided, chunked encoding is used.
 * @param {String} name the object key
 * @param {Readable} stream the ReadableStream
 * @param {Object} options
 * @return {Object}
 */
proto.putStream = function* putStream(name, stream, options) {
  options = options || {};
  options.headers = options.headers || {};
  if (options.contentLength) {
    options.headers['Content-Length'] = options.contentLength;
  } else {
    options.headers['Transfer-Encoding'] = 'chunked';
  }
  this._convertMetaToHeaders(options.meta, options.headers);
  var params = this._objectRequestParams('PUT', name, options);

  params.mime = options.mime;
  params.stream = stream;
  params.successStatuses = [200];

  var result = yield this.request(params);

  var ret = {
    name: name,
    url: this._objectUrl(name),
    res: result.res,
  };

  if (options.headers && options.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
};

proto.head = function* head(name, options) {
  var params = this._objectRequestParams('HEAD', name, options);
  params.successStatuses = [200, 304];

  var result = yield this.request(params);

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

proto.get = function* get(name, file, options) {
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
  if (options.process) {
    options.subres = options.subres || {};
    options.subres['x-oss-process'] = options.process;
  }

  var result;
  try {
    var params = this._objectRequestParams('GET', name, options);
    params.writeStream = writeStream;
    params.successStatuses = [200, 206, 304];

    result = yield this.request(params);

    if (needDestroy) {
      writeStream.destroy();
    }
  } catch (err) {
    if (needDestroy) {
      writeStream.destroy();
      // should delete the exists file before throw error
      debug('get error: %s, delete the exists file %s', err, file);
      yield this._deleteFileSafe(file);
    }
    throw err;
  }

  return {
    res: result.res,
    content: result.data
  };
};

proto.getStream = function* getStream(name, options) {
  options = options || {};
  var params = this._objectRequestParams('GET', name, options);
  params.customResponse = true;
  params.successStatuses = [200, 206, 304];

  var result = yield this.request(params);

  return {
    stream: result.res,
    res: {
      status: result.status,
      headers: result.headers
    }
  };
};

proto.delete = function* _delete(name, options) {
  var params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];

  var result = yield this.request(params);

  return {
    res: result.res
  };
};

proto.deleteMulti = function* deleteMulti(names, options) {
  options = options || {};
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Delete>\n';
  if (options.quiet) {
    xml += '  <Quiet>true</Quiet>\n';
  } else {
    xml += '  <Quiet>false</Quiet>\n';
  }
  for (var i = 0; i < names.length; i++) {
    xml += '  <Object><Key>' +
      utility.escape(this._objectName(names[i])) + '</Key></Object>\n';
  }
  xml += '</Delete>';
  debug('delete multi objects: %s', xml);

  options.subres = 'delete';
  var params = this._objectRequestParams('POST', '', options);
  params.mime = 'xml';
  params.content = xml;
  params.xmlResponse = true;
  params.successStatuses = [200];
  var result = yield this.request(params);

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

proto.copy = function* copy(name, sourceName, options) {
  options = options || {};
  options.headers = options.headers || {};
  for (var k in options.headers) {
    options.headers['x-oss-copy-source-' + k.toLowerCase()] = options.headers[k];
  }

  if (options.meta) {
    options.headers['x-oss-metadata-directive'] = 'REPLACE';
  }
  this._convertMetaToHeaders(options.meta, options.headers);

  if (sourceName[0] !== '/') {
    // no specify bucket name
    sourceName = '/' + this.options.bucket + '/' + encodeURIComponent(sourceName);
  } else {
    sourceName = '/' + encodeURIComponent(sourceName.slice(1));
  }

  options.headers['x-oss-copy-source'] = sourceName;

  var params = this._objectRequestParams('PUT', name, options);
  params.xmlResponse = true;
  params.successStatuses = [200, 304];

  var result = yield this.request(params);

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

proto.putMeta = function* putMeta(name, meta, options) {
  return yield this.copy(name, name, {
    meta: meta || {},
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  });
};

proto.list = function* list(query, options) {
  // prefix, marker, max-keys, delimiter

  var params = this._objectRequestParams('GET', '', options);
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

/*
 * Set object's ACL
 * @param {String} name the object key
 * @param {String} acl the object ACL
 * @param {Object} options
 */
proto.putACL = function* putACL(name, acl, options) {
  options = options || {};
  options.subres = 'acl';
  options.headers = options.headers || {};
  options.headers['x-oss-object-acl'] = acl;
  name = this._objectName(name);

  var params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    res: result.res
  };
};

/*
 * Get object's ACL
 * @param {String} name the object key
 * @param {Object} options
 * @return {Object}
 */
proto.getACL = function* getACL(name, options) {
  options = options || {};
  options.subres = 'acl';
  name = this._objectName(name);

  var params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  params.xmlResponse = true;

  var result = yield this.request(params);

  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName,
    },
    res: result.res
  };
};

proto.signatureUrl = function (name, options) {
  name = this._objectName(name);
  var params = {
    bucket: this.options.bucket,
    object: name
  };
  options = options || {};
  var expires = utility.timestamp() + (options.expires || 1800);
  var resource = this._getResource(params);
  var query = {};
  var signList = [];

  for (var k in options.response) {
    var key = 'response-' + k.toLowerCase();
    query[key] = options.response[k];
    signList.push(key + '=' + options.response[k]);
  }
  if (this.options.stsToken) {
    query['security-token'] = this.options.stsToken;
    signList.push('security-token=' + this.options.stsToken);
  }
  if (options.process){
    var processKeyword = 'x-oss-process';
    query[processKeyword] = options.process;
    var item = processKeyword + '=' + options.process;
    signList.push(item);
  }

  if (signList.length > 0) {
    signList.sort();
    resource += '?' + signList.join('&');
  }

  var stringToSign = [
    options.method || 'GET',
    options['content-md5'] || '', // Content-MD5
    options['content-type'] || '', // Content-Type
    expires,
    resource
  ].join('\n');
  var signature = this.signature(stringToSign);

  var url = urlutil.parse(this._getReqUrl(params));
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signature
  };
  copy(query).to(url.query);

  return url.format();
};

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint`.
 * @return {String} object url
 */
proto.getObjectUrl = function (name, baseUrl) {
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + this._escape(this._objectName(name));
};

proto._objectUrl = function (name) {
  return this._getReqUrl({bucket: this.options.bucket, object: name});
};

/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

proto._objectRequestParams = function (method, name, options) {
  if (!this.options.bucket) {
    throw new Error('Please create a bucket first');
  }

  options = options || {};
  name = this._objectName(name);
  var params = {
    object: name,
    bucket: this.options.bucket,
    method: method,
    subres: options && options.subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };

  if (options.headers) {
    params.headers = options.headers;
  }
  return params;
};

proto._objectName = function (name) {
  return name.replace(/^\/+/, '');
};

proto._statFile = function (filepath) {
  return function (callback) {
    fs.stat(filepath, callback);
  };
};

proto._convertMetaToHeaders = function (meta, headers) {
  if (!meta) {
    return;
  }

  for (var k in meta) {
    headers['x-oss-meta-' + k] = meta[k];
  }
};

proto._deleteFileSafe = function (filepath) {
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
};
