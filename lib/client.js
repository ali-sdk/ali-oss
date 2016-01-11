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
var urlutil = require('url');
var iputil = require('ip');

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
    secure: false,
    timeout: '60s',
    bucket: null,
    endpoint: null,
    cname: false,
  };

  this.options = {};
  copy(options).and(DEFAULT_OPTIONS).to(this.options);

  this.options.timeout = ms(this.options.timeout);

  if (this.options.endpoint) {
    this.options.endpoint = this._setEndpoint(this.options.endpoint);
  } else if(this.options.region) {
    this.options.endpoint = this._setRegion(
      this.options.region, this.options.internal, this.options.secure);
  } else {
    throw new Error('require region or endpoint.');
  }
  
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

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
proto.signature = function (stringToSign) {
  debug('authorization stringToSign: %s', stringToSign);

  var signature = crypto.createHmac('sha1', this.options.accessKeySecret);
  signature = signature.update(stringToSign).digest('base64');

  return signature;
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

proto.authorization = function (method, resource, subres, headers) {
  var params = [
    method.toUpperCase(),
    headers['Content-Md5'] || '',
    getHeader(headers, 'Content-Type'),
    headers['x-oss-date'] || new Date().toString()
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

  var resourceStr = '';
  resourceStr += resource;

  var subresList = [];
  for (var k in subres) {
    var item = subres.k ? k + '=' + subres.k : k;
    subresList.push(item);
  }
  if (subresList.length > 0) {
    resourceStr += '?' + subresList.join('&');
  }

  params.push(resourceStr);
  var stringToSign = params.join('\n');

  var auth = 'OSS ' + this.options.accessKeyId + ':';
  return auth + this.signature(stringToSign);
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
  var headers = {
    'x-oss-date': new Date().toGMTString()
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

  var authResource = this._getResource(params);
  headers.authorization = this.authorization(
    params.method, authResource, params.subres, headers);

  var url = this._getReqUrl(params)
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
  var parsed = urlutil.parse(resource);
  if (!parsed.pathname) {
    return resource;
  }

  parsed.pathname = parsed.pathname.split('/').map(function (p) {
    return encodeURIComponent(p);
  }).join('/');
  return urlutil.format(parsed);
};

proto._getResource = function (params) {
  var resource = '/';
  if (params.bucket) resource += params.bucket + '/';
  if (params.object) resource += params.object;

  return resource;
};

proto._isIP = function (host) {
  return iputil.isV4Format(host.replace(/:.*/g, ''));
};

proto._setEndpoint = function (endpoint) {
  var url = urlutil.parse(endpoint);

  if (!url.protocol) {
    url = urlutil.parse('http://' + endpoint);
  }

  if (url.protocol != 'http:' && url.protocol != 'https:') {
    throw new Error('Endpoint protocol must be http or https.');
  }

  return url;
};

proto._setRegion = function (region, internal, secure) {
  var protocol = secure ? 'https://' : 'http://';
  var suffix = internal ? '-internal.aliyuncs.com' : '.aliyuncs.com';

  return urlutil.parse(protocol + region + suffix);
};

proto._getReqUrl = function (params) {
  var ep = {};
  copy(this.options.endpoint).to(ep);
  ep.format = this.options.endpoint.format;

  var isIP = this._isIP(ep.host);
  var isCname = this.options.cname;
  if (params.bucket && !isCname && !isIP) {
    ep.host = params.bucket + '.' + ep.host;
  }

  var path = '/';
  if (params.bucket && isIP) {
    path += params.bucket + '/';
  }

  if (params.object) {
    path += params.object;
  }

  ep.pathname = this._escape(path);

  var query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    merge(query, params.subres);
  }

  if (Object.keys(query).length != 0) {
    ep.query = query;
  }

  return ep.format();
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
