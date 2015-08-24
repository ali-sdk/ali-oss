/**!
 * ali-oss - lib/object.js
 *
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
var url = require('url');

var proto = exports;

/**
 * Object operations
 */

proto.put = function* (name, file, options) {
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

  var params = this._objectRequestParams('PUT', name, options);
  params.mime = options.mime;
  params.stream = data.stream;
  params.content = data.content;
  params.successStatuses = [200];

  var result = yield* this.request(params);

  return {
    name: name,
    res: result.res,
  };
};

proto.head = function* (name, options) {
  var params = this._objectRequestParams('HEAD', name, options);
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
    var params = this._objectRequestParams('GET', name, options);
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
  var params = this._objectRequestParams('GET', name, options);
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
  var params = this._objectRequestParams('DELETE', name, options);
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

  var params = this._objectRequestParams('POST', '?delete', options);
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

  var params = this._objectRequestParams('PUT', name, options);
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

  var params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield* this.request(params);

  var objects = result.data.Contents;
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(function (obj) {
      return {
        name: obj.Key,
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

proto.signatureUrl = function (name, customHost) {
  name = this._objectName(name);
  var options = this.options;
  var authResource = this._escape('/' + options.bucket + '/' + name);
  var expires = utility.timestamp() + 1800;
  var params = [
    'GET',
    '', // md5
    '', // Content-Type
    expires, // Expires
    decodeURIComponent(authResource)
  ];

  debug('authorization with params: %j', params);

  var signature = crypto.createHmac('sha1', options.accessKeySecret);
  signature = signature.update(params.join('\n')).digest('base64');

  var url = 'http://';
  url += customHost ? (customHost + '/' + name) : (options.host + authResource);

  return url + '?OSSAccessKeyId=' + encodeURIComponent(options.accessKeyId) +
    '&Expires=' + expires + '&Signature=' + encodeURIComponent(signature);
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
    var stat = yield statFile(file);
    file = fs.createReadStream(file);
    eoe(file, function () {
      destroy(file);
    });
    content.size = stat.size;
  }

  if (!is.readableStream(file)) {
    throw new TypeError('upload file type error, support: localfile, Buffer and ReadStream');
  }

  content.stream = file;
  return content;
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
  var resource = '/' + this.options.bucket + '/' + name;
  var params = {
    name: name,
    method: method,
    resource: resource,
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
