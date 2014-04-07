/*!
 * ali-oss - lib/client.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var debug = require('debug')('ali-oss:client');
var copy = require('copy-to');
var is = require('is-type-of');
var read = require('co-read');
var mime = require('mime');
var urllib = require('co-urllib');
var xml = require('xml2js');

/**
 * Expose `Client`
 */

var exports = module.exports = Client;

exports.create = create;

var DEFAULT_OPTIONS = {
  host: 'oss.aliyuncs.com:8080',
  timeout: 3000
};

/**
 * aliyun OSS client
 * @param {Object} options
 *   - {String} accessKeyId
 *   - {String} accessKeySecret
 *   - {String} [host]
 *   - {Number} [timeout]
 */

function Client (options) {
  if (!options
    || !options.accessKeyId
    || !options.accessKeySecret
    || !options.bucket) {
    throw new Error('require accessKeyId, accessKeySecret and bucket');
  }
  copy(options).and(DEFAULT_OPTIONS).to(this);
  this.host = this.bucket + '.' + this.host;
}

/**
 * prototype
 */

var proto = Client.prototype;

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
  var auth = 'OSS ' + this.accessKeyId + ':';
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
      ossHeaders[lkey].push(headers[key].trim());
    }
  }

  var ossHeadersList = [];
  Object.keys(ossHeaders).sort().forEach(function (key) {
    ossHeadersList.push(key + ':' + ossHeaders[key].join(','));
  });

  params = params.concat(ossHeadersList);

  //TODO: support sub resource
  params.push(resource);

  debug('authorization with params: %j', params);

  var signature = crypto.createHmac('sha1', this.accessKeySecret);
  signature = signature.update(params.join('\n')).digest('base64');
  return auth + signature;
};

/**
 * request oss server
 * @param {Object} params
 *   - {String} name
 *   - {String} method
 *   - {Object} headers
 *   - [Buffer] content
 *   - {Number} timeout
 *
 * @api private
 */

proto.request = function* (params) {
  var url = 'http://' + this.host + '/' + params.name;
  var type = null;
  var md5 = null;
  var length = null;
  if (params.content) {
    type = mime.lookup(path.extname(params.name));
    md5 = crypto.createHash('md5').update(params.content).digest('base64');
    length = params.content.length;
  }

  var headers = {
    'Content-Type': type,
    'Content-Md5': md5,
    'Content-Length': length,
    'Date': new Date().toGMTString() + '123',
    'Host': this.host
  };
  copy(params.headers).to(headers);
  var resource = '/' + this.bucket + '/' + params.name;
  headers.authorization = this.authorization(params.method, resource, headers);

  debug('request %s %s, with headers %j', params.method, url, headers);

  return yield* urllib.request(url, {
    method: params.method,
    content: params.content,
    headers: headers,
    timeout: params.timeout
  });
};

/**
 * upload a file to oss
 * @param {Mix} file filepath, fileContent, stream
 * @param {String} name
 * @param {Object} [options]
 *   - {Number} timeout
 *   - {Object} headers
 * @param {Function} callback
 *
 * @api public
 */

proto.upload = function* (file, name, options) {
  options = options || {};
  var timeout = options.timeout || this.timeout;
  var content = yield* getContent(file);

  debug('start update %s with content length %d', name, content.length);
  var res = yield* this.request({
    name: name,
    content: content,
    headers: options.headers,
    timeout: timeout,
    method: 'PUT'
  });

  debug('upload %s response %s, with data: %s', name, res.status, res.data);

  if (res.status === 200) {
    return null;
  }

  throw yield* requestError(res);
};

/**
 * get an object from oss
 * @param {String} name
 * @param {String} target
 * @param {String} Options
 *   - {Number} timeout
 *   - {Objects} headers
 *
 * @api public
 */

proto.get = function* (name, target, options) {
  options = options || {};
  var timeout = options.timeout || this.timeout;

  //TODO
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
 * create a new oss client
 *
 * @api public
 */

function create(options) {
  return new Client(options);
}

/**
 * generater a request error with request response
 * @param {Object} res
 *
 * @api private
 */

function* requestError(res) {
  debug('request response error data: %s', res.data);

  var info = yield parseXml(res.data);
  info = info && info.Error
  ? info.Error
  : {};

  var err = new Error(info.Message || 'request error');
  err.status = res.status;
  err.code = info.Code;
  err.requestId = info.RequestId;
  err.host = info.HostId;

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
