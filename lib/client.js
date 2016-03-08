/**
 * Copyright(c) ali-sdk and other contributors.
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
var xml = require('xml2js');
var ms = require('humanize-ms');
var AgentKeepalive = require('agentkeepalive');
var merge = require('merge-descriptors');
var url = require('url');

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
    || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }

  var DEFAULT_OPTIONS = {
    region: 'oss-cn-hangzhou',
    internal: false,
    timeout: '60s',
    bucket: null,
    endpoint: null,
    cname: null,
  };

  this.options = {};
  copy(options).and(DEFAULT_OPTIONS).to(this.options);
  if (this.options.cname) {
    // make sure cname has protocol
    if (!/^https?:\/\//.test(this.options.cname)) {
      this.options.cname = 'http://' + this.options.cname;
    }
  }
  // support endpoint, alias to host
  this.options.host = this.options.endpoint || this.options.host;
  this.setRegion(this.options.region);

  this.options.timeout = ms(this.options.timeout);

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = require('urllib');
    this.agent = this.options.agent || new AgentKeepalive();
  }
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
 * ImageClient class
 */
Client.ImageClient = require('./image')(Client);
/**
 * Cluster Client class
 */
Client.ClusterClient = require('./cluster')(Client);

proto.setRegion = function (region) {
  if (!this.options.host || region !== this.options.region) {
    this.options.region = region;
    this.options.host = this._getRegionHost(region);
  }
  return this;
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
    headers['Content-Md5'] || '',
    getHeader(headers, 'Content-Type'),
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

  var stringToSign = params.join('\n');
  debug('authorization stringToSign: %s', stringToSign);

  var signature = crypto.createHmac('sha1', this.options.accessKeySecret);
  signature = signature.update(stringToSign, 'utf8').digest('base64');
  return auth + signature;
};

/**
 * create request params
 * @param {Object} params
 *   - {String} name
 *   - {String} method
 *   - {String} [resource]
 *   - {String} [region]
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Number} [timeout]
 *   - {Buffer} [content]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [customResponse]
 */

proto.createRequest = function (params) {
  var host = params.host || this.options.host;
  if (params.region) {
    host = this._getRegionHost(params.region);
  }
  var headers = {
    Date: new Date().toGMTString()
  };

  copy(params.headers).to(headers);

  if ((params.content || params.stream) && !getHeader(headers, 'Content-Type')) {
    if (params.mime && params.mime.indexOf('/') > 0) {
      headers['Content-Type'] = params.mime;
    } else {
      headers['Content-Type'] = mime.lookup(params.mime || path.extname(params.name));
    }
  }

  if (params.content) {
    headers['Content-Md5'] = crypto
      .createHash('md5')
      .update(params.content)
      .digest('base64');
    if (!headers['Content-Length']) {
      headers['Content-Length'] = params.content.length;
    }
  }

  var authResource = params.authResource || params.resource;
  headers.authorization = this.authorization(params.method, authResource, headers);

  var url = 'http://' + host + this._escape(params.resource);
  if (params.query) {
    url += '?' + querystring.stringify(params.query);
  }
  debug('request %s %s, with headers %j, !!stream: %s', params.method, url, headers, !!params.stream);
  var timeout = params.timeout || this.options.timeout;
  var reqParams = {
    agent: this.agent,
    method: params.method,
    content: params.content,
    stream: params.stream,
    headers: headers,
    timeout: timeout,
    writeStream: params.writeStream,
    customResponse: params.customResponse,
  };

  return {
    url: url,
    params: reqParams
  };
};

/**
 * request oss server
 * @param {Object} params
 *   - {String} name
 *   - {String} method
 *   - {String} [resource]
 *   - {String} [region]
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Number} [timeout]
 *   - {Buffer} [content]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [customResponse]
 *
 * @api private
 */

proto.request = function* (params) {
  var reqParams = this.createRequest(params);
  var result = yield this.urllib.requestThunk(reqParams.url, reqParams.params);
  debug('response %s %s, got %s, headers: %j', params.method, reqParams.url, result.status, result.headers);
  if (params.successStatuses && params.successStatuses.indexOf(result.status) === -1) {
    var err = yield* this.requestError(result);
    err.params = params;
    throw err;
  }
  if (params.xmlResponse) {
    result.data = yield this.parseXML(result.data);
  }
  return result;
};

proto._escape = function (resource) {
  resource = resource || '';
  let split = resource.indexOf('?');
  var pathname = resource;
  var query = '';
  if (split !== -1) {
    pathname = resource.slice(0, split);
    query = resource.slice(split);
  }
  // need remain '/'
  // oss don't support %20, use '+'
  return encodeURIComponent(pathname).replace(/%2F/g, '/').replace(/%20/g, '+') + query;
};

proto._getRegionHost = function (region) {
  if (this.options.internal) {
    return region + '-internal.aliyuncs.com';
  } else {
    return region + '.aliyuncs.com';
  }
};

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXML = function (str) {
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
  if (!result.data || !result.data.length) {
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
      info = yield this.parseXML(message) || {};
    } catch (err) {
      debug(message);
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

function getHeader(headers, name) {
  return headers[name] || headers[name.toLowerCase()];
}
