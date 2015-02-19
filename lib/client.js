/**!
 * ali-oss - lib/client.js
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
var path = require('path');
var querystring = require('querystring');
var copy = require('copy-to');
var mime = require('mime');
var urllib = require('urllib');
var xml = require('xml2js');
var ms = require('humanize-ms');
var AgentKeepalive = require('agentkeepalive');
var merge = require('merge-descriptors');

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

/**
 * Object operations
 */
merge(proto, require('./object'));
/**
 * Bucket operations
 */
merge(proto, require('./bucket'));

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

/**
 * request oss server
 * @param {Object} params
 *   - {String} name
 *   - {String} method
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Number} [timeout]
 *   - {Buffer} [content]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *
 * @api private
 */

proto.request = function* (params) {
  var headers = {
    Date: new Date().toGMTString(),
    Host: this.options.host
  };

  // TODO: if content is ReadStream, need to ignore content-md5
  if (params.content) {
    headers['Content-Type'] = mime.lookup(params.mime || path.extname(params.name));
    headers['Content-Md5'] = crypto
      .createHash('md5')
      .update(params.content)
      .digest('base64');
    headers['Content-Length'] = params.content.length;
  }

  copy(params.headers).to(headers);

  var resource = params.resource;
  if (!resource) {
    resource = '/' + this.options.bucket + '/' + params.name;
  }
  headers.authorization = this.authorization(params.method, resource, headers);

  var url = 'http://' + this.options.host + resource;
  if (params.query) {
    url += '?' + querystring.stringify(params.query);
  }
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

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXml = function (str) {
  return function (done) {
    if (Buffer.isBuffer(str)) {
      str = str.toString();
    }
    xml.parseString(str, {
      explicitRoot: false,
      explicitArray: false
    }, done);
  };
};

/**
 * generater a request error with request response
 * @param {Object} result
 *
 * @api private
 */

proto.requestError = function* (result) {
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
      info = yield this.parseXml(message) || {};
    } catch (err) {
      err.message += '\nraw xml: ' + message;
      err.status = result.status;
      err.requestId = result.headers['x-oss-request-id'];
      return err;
    }

    var message = info.Message || ('unknow request error, status: ' + result.status);
    if (info.Condition) {
      message += ' (condition: ' + info.Condition + ')';
    }
    var err = new Error(message);
    err.name = info.Code ? info.Code + 'Error' : 'UnknowError';
    err.status = result.status;
    err.code = info.Code;
    err.requestId = info.RequestId;
    err.hostId = info.HostId;
  }

  debug('generate error %j', err);
  return err;
};
