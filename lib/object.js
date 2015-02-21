/**!
 * ali-oss - lib/object.js
 *
 * Copyright(c) node-modules and other contributors.
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
var read = require('co-read');

var proto = exports;

/**
 * Object operations
 */

proto.put = function* (name, file, options) {
  name = this._objectName(name);
  options = options || {};
  var content = yield* getContent(file);

  var headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, headers);

  debug('start update %s with content length %d, headers: %j',
    name, content.length, headers);
  var result = yield* this.request({
    name: name,
    content: content,
    headers: headers,
    timeout: options.timeout,
    mime: options.mime,
    method: 'PUT',
    successStatuses: [200]
  });

  return {
    name: name,
    res: result.res,
  };
};

proto.head = function* (name, options) {
  name = this._objectName(name);
  options = options || {};
  var result = yield* this.request({
    name: name,
    timeout: options.timeout,
    headers: options.headers,
    method: 'HEAD',
    successStatuses: [200, 304]
  });

  var data = {
    status: result.status,
    meta: null,
    res: result.res,
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
  name = this._objectName(name);
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
    result = yield* this.request({
      name: name,
      headers: options.headers,
      timeout: options.timeout,
      method: 'GET',
      writeStream: writeStream,
      successStatuses: [200, 206, 304]
    });
  } catch (err) {
    throw err;
  } finally {
    needDestroy && writeStream.destroy();
  }

  return {
    content: result.data,
    res: result.res,
  };
};

proto.delete = function* (name, options) {
  name = this._objectName(name);
  var result = yield* this.request({
    name: name,
    method: 'DELETE',
    timeout: options && options.timeout,
    successStatuses: [204]
  });

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
  var result = yield this.request({
    method: 'POST',
    name: '?delete',
    content: xml,
    mime: 'xml',
    timeout: options.timeout,
    successStatuses: [200],
    xmlResponse: true,
  });

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
    deleted: deleted,
    res: result.res,
  };
};

proto.copy = function* (name, sourceName, options) {
  name = this._objectName(name);
  if (sourceName[0] !== '/') {
    // copy same bucket object
    sourceName = '/' + this.options.bucket + '/' + sourceName;
  }
  options = options || {};
  var headers = options.headers || {};
  for (var k in headers) {
    headers['x-oss-copy-source-' + k.toLowerCase()] = headers[k];
  }

  if (options.meta) {
    headers['x-oss-metadata-directive'] = 'REPLACE';
  }
  this._convertMetaToHeaders(options.meta, headers);

  headers['x-oss-copy-source'] = sourceName;

  var result = yield* this.request({
    method: 'PUT',
    name: name,
    headers: headers,
    timeout: options.timeout,
    successStatuses: [200, 304],
    xmlResponse: true,
  });

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
  var result = yield* this.request({
    method: 'GET',
    name: '',
    query: query,
    timeout: options && options.timeout,
    successStatuses: [200],
    xmlResponse: true,
  });

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
    objects: objects,
    prefixes: prefixes,
    isTruncated: result.data.IsTruncated === 'true',
    nextMarker: result.data.NextMarker || null,
    res: result.res
  };
};

proto.signatureUrl = function (name) {
  var resourceName = '/' + this.options.bucket + '/' + name;
  var expires = utility.timestamp() + 1800;
  var params = [
    'GET',
    '', // md5
    '', // Content-Type
    expires, // Expires
    resourceName,
  ];

  debug('authorization with params: %j', params);

  var signature = crypto.createHmac('sha1', this.options.accessKeySecret);
  signature = signature.update(params.join('\n')).digest('base64');
  var url = this._objectUrl(name);
  return url + '?OSSAccessKeyId=' + encodeURIComponent(this.options.accessKeyId) +
    '&Expires=' + expires + '&Signature=' + encodeURIComponent(signature);
};

proto._objectName = function (name) {
  if (name[0] === '/') {
    name = name.substring(1);
  }
  return name;
};

proto._objectUrl = function (name) {
  return 'http://' + this.options.host + '/' + this.options.bucket + '/' + name;
};

proto._convertMetaToHeaders = function (meta, headers) {
  if (!meta) {
    return;
  }

  for (var k in meta) {
    headers['x-oss-meta-' + k] = meta[k];
  }
};

/**
 * get content from string(file path), buffer(file content), stream(file stream)
 * @param {Mix} file
 * @return {Buffer}
 *
 * @api private
 */

function* getContent(file) {
  if (is.buffer(file)) {
    return file;
  }

  var created = false;
  if (is.string(file)) {
    file = fs.createReadStream(file);
    created = true;
  }

  if (!is.readableStream(file)) {
    throw new TypeError('upload file type error');
  }

  var bufs = [];
  var buf;
  while (buf = yield read(file)) {
    bufs.push(buf);
  }

  if (created) {
    file.destroy();
  }
  return Buffer.concat(bufs);
}
