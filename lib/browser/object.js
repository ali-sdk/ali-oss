
// const debug = require('debug')('ali-oss:object');
const utility = require('utility');
const fs = require('fs');
const is = require('is-type-of');
const urlutil = require('url');
const copy = require('copy-to');
const path = require('path');
const mime = require('mime');
const callback = require('../common/callback');
const signHelper = require('../common/signUtils');
const merge = require('merge-descriptors');
const isBlob = require('../common/utils/isBlob');
const isFile = require('../common/utils/isFile');

// var assert = require('assert');


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
proto.append = async function append(name, file, options) {
  options = options || {};
  if (options.position === undefined) options.position = '0';
  options.subres = {
    append: '',
    position: options.position
  };
  options.method = 'POST';

  const result = await this.put(name, file, options);
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
proto.put = async function put(name, file, options) {
  let content;
  options = options || {};
  name = this._objectName(name);
  if (is.buffer(file)) {
    content = file;
  } else if (isBlob(file) || isFile(file)) {
    if (!options.mime) {
      if (isFile(file)) {
        options.mime = mime.getType(path.extname(file.name));
      } else {
        options.mime = file.type;
      }
    }

    const stream = this._createStream(file, 0, file.size);
    options.contentLength = await this._getFileSize(file);
    try {
      const result = await this.putStream(name, stream, options);
      return result;
    } catch (err) {
      if (err.code === 'RequestTimeTooSkewed') {
        this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date();
        return await this.put(name, file, options);
      }
    }
  } else {
    throw new TypeError('Must provide Buffer/Blob/File for put.');
  }

  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);
  callback.encodeCallback(params, options);
  params.mime = options.mime;
  params.content = content;
  params.successStatuses = [200];

  const result = await this.request(params);

  const ret = {
    name,
    url: this._objectUrl(name),
    res: result.res
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
proto.putStream = async function putStream(name, stream, options) {
  options = options || {};
  options.headers = options.headers || {};
  name = this._objectName(name);
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

  const result = await this.request(params);

  const ret = {
    name,
    url: this._objectUrl(name),
    res: result.res
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
};


merge(proto, require('../common/object/copyObject'));
merge(proto, require('../common/object/getObjectTagging'));
merge(proto, require('../common/object/putObjectTagging'));
merge(proto, require('../common/object/deleteObjectTagging'));
merge(proto, require('../common/image'));
merge(proto, require('../common/object/getBucketVersions'));
merge(proto, require('../common/object/getACL'));
merge(proto, require('../common/object/putACL'));
merge(proto, require('../common/object/head'));
merge(proto, require('../common/object/delete'));
merge(proto, require('../common/object/get'));

proto.putMeta = async function putMeta(name, meta, options) {
  const copyResult = await this.copy(name, name, {
    meta: meta || {},
    timeout: options && options.timeout,
    ctx: options && options.ctx
  });
  return copyResult;
};

proto.list = async function list(query, options) {
  // prefix, marker, max-keys, delimiter

  const params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);
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
        displayName: obj.Owner.DisplayName
      }
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
    isTruncated: result.data.IsTruncated === 'true'
  };
};

/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
proto.restore = async function restore(name, options) {
  options = options || {};
  options.subres = Object.assign({ restore: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = this._objectRequestParams('POST', name, options);
  params.successStatuses = [202];

  const result = await this.request(params);

  return {
    res: result.res
  };
};

proto.signatureUrl = function signatureUrl(name, options) {
  options = options || {};
  name = this._objectName(name);
  options.method = options.method || 'GET';
  const expires = utility.timestamp() + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name
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
    Signature: signRes.Signature
  };

  copy(signRes.subResource).to(url.query);

  return url.format();
};

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`,
 *        will use `baseUrl` instead the default `endpoint`.
 * @return {String} object url
 */
proto.getObjectUrl = function getObjectUrl(name, baseUrl) {
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + this._escape(this._objectName(name));
};

proto._objectUrl = function _objectUrl(name) {
  return this._getReqUrl({ bucket: this.options.bucket, object: name });
};

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */
proto.generateObjectUrl = function (name, baseUrl) {
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
    const copyUrl = urlutil.parse(baseUrl);
    const { bucket } = this.options;

    copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
    copyUrl.host = `${bucket}.${copyUrl.host}`;
    baseUrl = copyUrl.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + this._escape(this._objectName(name));
};


/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

proto._objectRequestParams = function _objectRequestParams(method, name, options) {
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
    ctx: options && options.ctx
  };

  if (options.headers) {
    params.headers = {};
    copy(options.headers).to(params.headers);
  }
  return params;
};

proto._objectName = function _objectName(name) {
  return name.replace(/^\/+/, '');
};

proto._convertMetaToHeaders = function _convertMetaToHeaders(meta, headers) {
  if (!meta) {
    return;
  }

  Object.keys(meta).forEach((k) => {
    headers[`x-oss-meta-${k}`] = meta[k];
  });
};

proto._deleteFileSafe = function _deleteFileSafe(filepath) {
  return new Promise((resolve) => {
    fs.exists(filepath, (exists) => {
      if (!exists) {
        resolve();
      } else {
        fs.unlink(filepath, (err) => {
          if (err) {
            this.debug('unlink %j error: %s', filepath, err, 'error');
          }
          resolve();
        });
      }
    });
  });
};
