

const debug = require('debug')('ali-oss:object');
const utility = require('utility');
const fs = require('fs');
const is = require('is-type-of');
const urlutil = require('url');
const copy = require('copy-to');
const path = require('path');
const mime = require('mime');
const callback = require('./common/callback');
const signHelper = require('./common/signUtils');


const proto = exports;

/**
 * Object operations
 */

/**
  * append an object from String(file path)/Buffer/ReadableStream
  * @param {String} name the object key
  * @param {Mixed} file String(file path)/Buffer/ReadableStream
  * @param {Object} options
  * @return {Object}
  */
proto.append = function* (name, file, options) {
  options = options || {};
  if (options.position === undefined) options.position = '0';
  options.subres = {
    append: '',
    position: options.position,
  };
  options.method = 'POST';

  const result = yield this.put(name, file, options);
  result.nextAppendPosition = result.res.headers['x-oss-next-append-position'];
  return result;
};

/**
 * put an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url  the OSS sends a callback request to this URL
 *        {String} options.callback.host  The host header value for initiating callback requests
 *        {String} options.callback.body  The value of the request body when a callback is initiated
 *        {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 * @return {Object}
 */
proto.put = function* put(name, file, options) {
  let content;

  options = options || {};

  if (is.buffer(file)) {
    content = file;
  } else if (is.string(file)) {
    options.mime = options.mime || mime.lookup(path.extname(file));
    const stream = fs.createReadStream(file);
    options.contentLength = yield this._getFileSize(file);
    return yield this.putStream(name, stream, options);
  } else if (is.readableStream(file)) {
    return yield this.putStream(name, file, options);
  } else {
    throw new TypeError('Must provide String/Buffer/ReadableStream for put.');
  }

  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);

  callback.encodeCallback(params, options);

  params.mime = options.mime;
  params.content = content;
  params.successStatuses = [200];

  const result = yield this.request(params);

  const ret = {
    name,
    url: this._objectUrl(name),
    res: result.res,
  };

  if (params.headers && params.headers['x-oss-callback']) {
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

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);
  callback.encodeCallback(params, options);
  params.mime = options.mime;
  params.stream = stream;
  params.successStatuses = [200];

  const result = yield this.request(params);

  const ret = {
    name,
    url: this._objectUrl(name),
    res: result.res,
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
};

proto.head = function* head(name, options) {
  const params = this._objectRequestParams('HEAD', name, options);
  params.successStatuses = [200, 304];

  const result = yield this.request(params);

  const data = {
    meta: null,
    res: result.res,
    status: result.status,
  };

  if (result.status === 200) {
    Object.keys(result.headers).forEach((k) => {
      if (k.indexOf('x-oss-meta-') === 0) {
        if (!data.meta) {
          data.meta = {};
        }
        data.meta[k.substring(11)] = result.headers[k];
      }
    });
  }
  return data;
};

proto.get = function* get(name, file, options) {
  let writeStream = null;
  let needDestroy = false;

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

  let result;
  try {
    const params = this._objectRequestParams('GET', name, options);
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
    content: result.data,
  };
};

proto.getStream = function* getStream(name, options) {
  options = options || {};

  if (options.process) {
    options.subres = options.subres || {};
    options.subres['x-oss-process'] = options.process;
  }

  const params = this._objectRequestParams('GET', name, options);
  params.customResponse = true;
  params.successStatuses = [200, 206, 304];

  const result = yield this.request(params);

  return {
    stream: result.res,
    res: {
      status: result.status,
      headers: result.headers,
    },
  };
};

proto.delete = function* _delete(name, options) {
  const params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];

  const result = yield this.request(params);

  return {
    res: result.res,
  };
};

proto.deleteMulti = function* deleteMulti(names, options) {
  options = options || {};
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Delete>\n';
  if (options.quiet) {
    xml += '  <Quiet>true</Quiet>\n';
  } else {
    xml += '  <Quiet>false</Quiet>\n';
  }
  for (let i = 0; i < names.length; i++) {
    xml += `  <Object><Key>${
      utility.escape(this._objectName(names[i]))}</Key></Object>\n`;
  }
  xml += '</Delete>';
  debug('delete multi objects: %s', xml);

  options.subres = 'delete';
  const params = this._objectRequestParams('POST', '', options);
  params.mime = 'xml';
  params.content = xml;
  params.xmlResponse = true;
  params.successStatuses = [200];
  const result = yield this.request(params);

  const r = result.data;
  let deleted = (r && r.Deleted) || null;
  if (deleted) {
    if (!Array.isArray(deleted)) {
      deleted = [deleted];
    }
    deleted = deleted.map(item => item.Key);
  }
  return {
    res: result.res,
    deleted,
  };
};

/* eslint no-shadow: [0] */
proto.copy = function* copy(name, sourceName, options) {
  options = options || {};
  options.headers = options.headers || {};

  Object.keys(options.headers).forEach((key) => {
    options.headers[`x-oss-copy-source-${key.toLowerCase()}`] = options.headers[key];
  });
  if (options.meta) {
    options.headers['x-oss-metadata-directive'] = 'REPLACE';
  }
  this._convertMetaToHeaders(options.meta, options.headers);

  if (sourceName[0] !== '/') {
    // no specify bucket name
    sourceName = `/${this.options.bucket}/${encodeURIComponent(sourceName)}`;
  } else {
    sourceName = `/${encodeURIComponent(sourceName.slice(1))}`;
  }

  options.headers['x-oss-copy-source'] = sourceName;

  const params = this._objectRequestParams('PUT', name, options);
  params.xmlResponse = true;
  params.successStatuses = [200, 304];

  const result = yield this.request(params);

  let { data } = result;
  if (data) {
    data = {
      etag: data.ETag,
      lastModified: data.LastModified,
    };
  }

  return {
    data,
    res: result.res,
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

  const params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = yield this.request(params);
  let objects = result.data.Contents;
  const that = this;
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(obj => ({
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
      },
    }));
  }
  let prefixes = result.data.CommonPrefixes || null;
  if (prefixes) {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes];
    }
    prefixes = prefixes.map(item => item.Prefix);
  }
  return {
    res: result.res,
    objects,
    prefixes,
    nextMarker: result.data.NextMarker || null,
    isTruncated: result.data.IsTruncated === 'true',
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

  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];

  const result = yield this.request(params);

  return {
    res: result.res,
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

  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = yield this.request(params);

  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName,
    },
    res: result.res,
  };
};

/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
proto.restore = function* restore(name, options) {
  options = options || {}
  options.subres = 'restore';
  const params = this._objectRequestParams('POST', name, options);
  params.successStatuses = [202];

  const result = yield this.request(params);

  return {
    res: result.res,
  };
}

proto.signatureUrl = function (name, options) {
  options = options || {};
  name = this._objectName(name);
  options.method = options.method || 'GET';
  const expires = utility.timestamp() + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name,
  };

  const resource = this._getResource(params);

  if (this.options.stsToken) {
    options['security-token'] = this.options.stsToken;
  }

  const signRes = signHelper._signatureForURL(this.options.accessKeySecret, options, resource, expires);

  const url = urlutil.parse(this._getReqUrl(params));
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signRes.Signature,
  };

  copy(signRes.subResource).to(url.query);

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
  return this._getReqUrl({ bucket: this.options.bucket, object: name });
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
  const params = {
    object: name,
    bucket: this.options.bucket,
    method,
    subres: options && options.subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };

  if (options.headers) {
    params.headers = {};
    copy(options.headers).to(params.headers);
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

  Object.keys(meta).forEach((k) => {
    headers[`x-oss-meta-${k}`] = meta[k];
  });
};

proto._deleteFileSafe = function (filepath) {
  return function (callback) {
    fs.exists(filepath, (exists) => {
      if (!exists) {
        callback();
      } else {
        fs.unlink(filepath, (err) => {
          if (err) {
            debug('unlink %j error: %s', filepath, err);
          }
          callback();
        });
      }
    });
  };
};
