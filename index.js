/**!
 * ali-oss - index.js
 *
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com>
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('ali-oss');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var copy = require('copy-to');
var is = require('is-type-of');
var read = require('co-read');
var mime = require('mime');
var urllib = require('urllib');
var xml = require('xml2js');
var ms = require('humanize-ms');
var utility = require('utility');
var AgentKeepalive = require('agentkeepalive');

var agent = new AgentKeepalive();

/**
 * Expose `Client`
 */

module.exports = Client;

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  if (!options
    || !options.accessKeyId
    || !options.accessKeySecret
    || !options.bucket) {
    throw new Error('require accessKeyId, accessKeySecret and bucket');
  }

  var DEFAULT_OPTIONS = {
    host: 'oss.aliyuncs.com',
    timeout: '60s',
  };

  this.options = {};
  copy(options).and(DEFAULT_OPTIONS).to(this.options);

  this.options.timeout = ms(this.options.timeout);
}

/**
 * prototype
 */

var proto = Client.prototype;

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

/**
 * get author header
 *
 * "Authorization: OSS " + Access Key Id + ":" + Signature
 *
 * Signature = base64(hmac-sha1(Access Key Secret + "\n"
 *  + VERB + "\n"
 *  + CONTENT-MD5 + "\n"
 *  + CONTENT-TYPE + "\n"
 *  + DATE + "\n"
 *  + CanonicalizedOSSHeaders
 *  + CanonicalizedResource))
 *
 * @param {String} method
 * @param {String} resource
 * @param {Object} header
 * @return {String}
 *
 * @api private
 */

proto.authorization = function (method, resource, headers) {
  var auth = 'OSS ' + this.options.accessKeyId + ':';
  var params = [
    method.toUpperCase(),
    headers['Content-Md5'],
    headers['Content-Type'],
    headers.Date || new Date().toString()
  ];

  var ossHeaders = {};
  for (var key in headers) {
    var lkey = key.toLowerCase().trim();
    if (lkey.indexOf('x-oss-') === 0) {
      ossHeaders[lkey] = ossHeaders[lkey] || [];
      ossHeaders[lkey].push(String(headers[key]).trim());
    }
  }

  var ossHeadersList = [];
  Object.keys(ossHeaders).sort().forEach(function (key) {
    ossHeadersList.push(key + ':' + ossHeaders[key].join(','));
  });

  params = params.concat(ossHeadersList);

  // TODO: support sub resource
  params.push(resource);

  debug('authorization with params: %j', params);

  var signature = crypto.createHmac('sha1', this.options.accessKeySecret);
  signature = signature.update(params.join('\n')).digest('base64');
  return auth + signature;
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

/**
 * request oss server
 * @param {Object} params
 *   - {String} name
 *   - {String} method
 *   - {Object} headers
 *   - {Number} timeout
 *   - {Buffer} [content]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *
 * @api private
 */

proto.request = function* (params) {
  var url = this._objectUrl(params.name);
  var headers = {
    Date: new Date().toGMTString(),
    Host: this.options.host
  };

  if (params.content) {
    headers['Content-Type'] = mime.lookup(params.mime || path.extname(params.name));
    headers['Content-Md5'] = crypto
      .createHash('md5')
      .update(params.content)
      .digest('base64');
    headers['Content-Length'] = params.content.length;
  }

  copy(params.headers).to(headers);

  var resource = '/' + this.options.bucket + '/' + params.name;
  headers.authorization = this.authorization(params.method, resource, headers);

  debug('request %s %s, with headers %j', params.method, url, headers);
  var timeout = params.timeout || this.options.timeout;
  var result = yield urllib.requestThunk(url, {
    agent: agent,
    method: params.method,
    content: params.content,
    headers: headers,
    timeout: timeout,
    writeStream: params.writeStream
  });
  debug('response %s %s, got %s, headers: %j', params.method, url, result.status, result.headers);
  return result;
};

proto.put = function* (name, file, options) {
  name = this._objectName(name);
  options = options || {};
  var content = yield* getContent(file);

  var headers = options.headers || {};
  if (options.meta) {
    for (var k in options.meta) {
      headers['x-oss-meta-' + k] = options.meta[k];
    }
  }
  debug('start update %s with content length %d, headers: %j',
    name, content.length, headers);
  var result = yield* this.request({
    name: name,
    content: content,
    headers: headers,
    timeout: options.timeout,
    mime: options.mime,
    method: 'PUT'
  });

  if (result.status === 200) {
    return {
      name: name,
      res: result.res,
    };
  }

  throw yield* requestError(result);
};

proto.head = function* (name, options) {
  name = this._objectName(name);
  options = options || {};
  var result = yield* this.request({
    name: name,
    timeout: options.timeout,
    headers: options.headers,
    method: 'HEAD'
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
    return data;
  }
  if (result.status === 304) {
    return data;
  }

  throw yield* requestError(result);
};

/**
 * get an object from oss
 * support return a buffer, write into file and write into Stream
 *
 * ```
 * get('test.png', stream);
 *
 * get('test.png', './test.png');
 *
 * var content = get('test.png');
 *```
 *
 *
 * @param {String} name
 * @param {Mix} [path]
 *   if give a string file path, will write into this file
 *   if give a writeStream, will write into this stream
 *   if empty, will return a buffer
 * @param {String} Options
 *   - {Number} timeout
 *   - {Objects} headers
 *   ignore if writeStream exist
 * @api public
 */

proto.download = function* (name, path, options) {
  var writeStream = null;
  var needDestroy = false;

  if (is.writableStream(path)) {
    writeStream = path;
  } else if (is.string(path)) {
    writeStream = fs.createWriteStream(path);
    needDestroy = true;
  } else {
    options = path;
  }

  options = options || {};
  var timeout = options.timeout || this.timeout;

  debug('get file %s', name);

  var res;
  try {
    res = yield* this.request({
      name: name,
      headers: options.headers,
      timeout: timeout,
      method: 'GET',
      writeStream: writeStream
    });
  } catch (err) {
    throw err;
  } finally {
    needDestroy && writeStream.destroy();
  }

  if (res.status === 200) {
    return res.data;
  }
  throw yield* requestError(res);
};

proto.delete = function* (name, options) {
  name = this._objectName(name);
  var result = yield* this.request({
    name: name,
    method: 'DELETE',
    timeout: options && options.timeout
  });

  if (result.status === 204) {
    return {
      res: result.res
    };
  }
  throw yield* requestError(result);
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

/**
 * generater a request error with request response
 * @param {Object} result
 *
 * @api private
 */

function* requestError(result) {
  var err;
  if (!result.data.length) {
    // HEAD not exists resource
    if (result.status === 404) {
      err = new Error('Object not exists');
      err.name = 'NoSuchKeyError';
      err.status = 404;
      err.code = 'NoSuchKey';
    } else if (result.status === 412) {
      err = new Error('Pre condition failed');
      err.name = 'PreconditionFailedError';
      err.status = 412;
      err.code = 'PreconditionFailed';
    } else {
      err = new Error('Unknow error, status: ' + result.status);
      err.name = 'UnknowError';
      err.status = result.status;
    }
    err.requestId = result.headers['x-oss-request-id'];
    err.host = '';
  } else {
    var message = String(result.data);
    debug('request response error data: %s', message);

    var info;
    try {
      info = yield parseXml(message);
    } catch (err) {
      err.message += '\nraw xml: ' + message;
      err.status = result.status;
      err.requestId = result.headers['x-oss-request-id'];
      return err;
    }

    info = info && info.Error || {};

    var message = info.Message || ('unknow request error, status: ' + result.status);
    var err = new Error(message);
    err.name = info.Code ? info.Code + 'Error' : 'UnknowError';
    err.status = result.status;
    err.code = info.Code;
    err.requestId = info.RequestId;
    err.host = info.HostId;
  }

  debug('generate error %j', err);
  return err;
}

/**
 * thunkify xml.parseString
 * @param {String} str
 *
 * @api private
 */

function parseXml(str) {
  return function (done) {
    xml.parseString(str, done);
  };
}
