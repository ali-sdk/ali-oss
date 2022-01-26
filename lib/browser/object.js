// const debug = require('debug')('ali-oss:object');
const fs = require('fs');
const copy = require('copy-to');
const path = require('path');
const mime = require('mime');
const callback = require('../common/callback');
const merge = require('merge-descriptors');
const { isBlob } = require('../common/utils/isBlob');
const { isFile } = require('../common/utils/isFile');
const { isBuffer } = require('../common/utils/isBuffer');
const { obj2xml } = require('../common/utils/obj2xml');

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
  options.disabledMD5 = options.disabledMD5 === undefined ? true : !!options.disabledMD5;
  options.headers = options.headers || {};
  name = this._objectName(name);
  if (isBuffer(file)) {
    content = file;
  } else if (isBlob(file) || isFile(file)) {
    if (!options.mime) {
      if (isFile(file)) {
        options.mime = mime.getType(path.extname(file.name));
      } else {
        options.mime = file.type;
      }
    }

    content = await this._createBuffer(file, 0, file.size);
    options.contentLength = await this._getFileSize(file);
  } else {
    throw new TypeError('Must provide Buffer/Blob/File for put.');
  }

  this._convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);
  callback.encodeCallback(params, options);
  params.mime = options.mime;
  params.disabledMD5 = options.disabledMD5;
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
merge(proto, require('../common/object/putSymlink'));
merge(proto, require('../common/object/getSymlink'));
merge(proto, require('../common/object/deleteMulti'));
merge(proto, require('../common/object/getObjectMeta'));
merge(proto, require('../common/object/getObjectUrl'));
merge(proto, require('../common/object/generateObjectUrl'));
merge(proto, require('../common/object/signatureUrl'));

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
  let objects = result.data.Contents || [];
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

proto.listV2 = async function listV2(query, options = {}) {
  const continuation_token = query['continuation-token'] || query.continuationToken;
  if (continuation_token) {
    options.subres = Object.assign(
      {
        'continuation-token': continuation_token
      },
      options.subres
    );
  }
  const params = this._objectRequestParams('GET', '', options);
  params.query = Object.assign({ 'list-type': 2 }, query);
  delete params.query['continuation-token'];
  delete params.query.continuationToken;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);
  let objects = result.data.Contents || [];
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
      owner: obj.Owner
        ? {
            id: obj.Owner.ID,
            displayName: obj.Owner.DisplayName
          }
        : null
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
    isTruncated: result.data.IsTruncated === 'true',
    keyCount: +result.data.KeyCount,
    continuationToken: result.data.ContinuationToken || null,
    nextContinuationToken: result.data.NextContinuationToken || null
  };
};

/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
proto.restore = async function restore(name, options = { type: 'Archive' }) {
  options = options || {};
  options.subres = Object.assign({ restore: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = this._objectRequestParams('POST', name, options);
  if (options.type === 'ColdArchive') {
    const paramsXMLObj = {
      RestoreRequest: {
        Days: options.Days ? options.Days : 2,
        JobParameters: {
          Tier: options.JobParameters ? options.JobParameters : 'Standard'
        }
      }
    };
    params.content = obj2xml(paramsXMLObj, {
      headers: true
    });
    params.mime = 'xml';
  }
  params.successStatuses = [202];

  const result = await this.request(params);

  return {
    res: result.res
  };
};

proto._objectUrl = function _objectUrl(name) {
  return this._getReqUrl({ bucket: this.options.bucket, object: name });
};

/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

proto._objectRequestParams = function _objectRequestParams(method, name, options) {
  if (!this.options.bucket && !this.options.cname) {
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

  Object.keys(meta).forEach(k => {
    headers[`x-oss-meta-${k}`] = meta[k];
  });
};

proto._deleteFileSafe = function _deleteFileSafe(filepath) {
  return new Promise(resolve => {
    fs.exists(filepath, exists => {
      if (!exists) {
        resolve();
      } else {
        fs.unlink(filepath, err => {
          if (err) {
            this.debug('unlink %j error: %s', filepath, err, 'error');
          }
          resolve();
        });
      }
    });
  });
};
