'use strict';

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
var is = require('is-type-of');
var platform = require('platform');
var utility = require('utility');
var urllib = require('urllib');
var pkg = require('../package.json');
var dateFormat = require('dateformat');
var bowser = require('bowser');

var globalHttpAgent = new AgentKeepalive();

/**
 * Expose `Client`
 */

module.exports = Client;

function Client(options, ctx) {
  if (!(this instanceof Client)) {
    return new Client(options, ctx);
  }

  if (options && options.inited) {
    this.options = options;
  } else {
    this.options = Client.initOptions(options);
  }

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = urllib;
    this.agent = this.options.agent || globalHttpAgent;
  }
  this.ctx = ctx;
}

Client.initOptions = function initOptions(options) {
  if (!options
    || !options.accessKeyId
    || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }

  var opts = {
    region: 'oss-cn-hangzhou',
    internal: false,
    secure: false,
    timeout: 60000, // 60s
    bucket: null,
    endpoint: null,
    cname: false,
  };

  for (const key in options) {
    if (options[key] === undefined) continue;
    opts[key] = options[key];
  }
  opts.accessKeyId = opts.accessKeyId.trim();
  opts.accessKeySecret = opts.accessKeySecret.trim();

  opts.timeout = ms(opts.timeout);

  if (opts.endpoint) {
    opts.endpoint = setEndpoint(opts.endpoint);
  } else if (opts.region) {
    opts.endpoint = setRegion(
      opts.region, opts.internal, opts.secure);
  } else {
    throw new Error('require options.endpoint or options.region');
  }

  opts.inited = true;
  return opts;
};


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
 * Multipart operations
 */
merge(proto, require('./multipart'));

/**
 * ImageClient class
 */
Client.ImageClient = require('./image')(Client);
/**
 * Cluster Client class
 */
Client.ClusterClient = require('./cluster')(Client);

/**
 * STS Client class
 */
Client.STS = require('./sts');

/**
 * Aysnc wrapper
 */
Client.Wrapper = require('./wrapper');

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
proto.signature = function signature(stringToSign) {
  debug('authorization stringToSign: %s', stringToSign);

  var signature = crypto.createHmac('sha1', this.options.accessKeySecret);
  signature = signature.update(new Buffer(stringToSign, 'utf8')).digest('base64');

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

proto.authorization = function authorization(method, resource, subres, headers) {
  var params = [
    method.toUpperCase(),
    headers['Content-Md5'] || '',
    getHeader(headers, 'Content-Type'),
    headers['x-oss-date']
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
  if (subres) {
    if (is.string(subres)) {
      subresList.push(subres);
    } else if (is.array(subres)) {
      subresList = subresList.concat(subres);
    } else {
      for (var k in subres) {
        var item = subres[k] ? k + '=' + subres[k] : k;
        subresList.push(item);
      }
    }
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
 * See `request`
 * @api private
 */

proto.createRequest = function createRequest(params) {
  var userAgent = this._userAgent();

  var headers = {
    'x-oss-date': dateFormat(new Date(), 'UTC:ddd, dd mmm yyyy HH:MM:ss \'GMT\''),
    'x-oss-user-agent': userAgent,
    'User-Agent': userAgent
  };

  if (this.options.stsToken) {
    headers['x-oss-security-token'] = this.options.stsToken;
  }

  copy(params.headers).to(headers);

  if (!getHeader(headers, 'Content-Type')) {
    if (params.mime === mime.default_type) {
      params.mime = '';
    }

    if (params.mime && params.mime.indexOf('/') > 0) {
      headers['Content-Type'] = params.mime;
    } else {
      headers['Content-Type'] = mime.lookup(params.mime || path.extname(params.object || ''));
    }
  }

  if (params.content) {
    headers['Content-Md5'] = crypto
      .createHash('md5')
      .update(new Buffer(params.content, 'utf8'))
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
    ctx: params.ctx || this.ctx,
  };

  return {
    url: url,
    params: reqParams
  };
};

/**
 * request oss server
 * @param {Object} params
 *   - {String} object
 *   - {String} bucket
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Buffer} [content]
 *   - {Stream} [stream]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [xmlResponse]
 *   - {Boolean} [customResponse]
 *   - {Number} [timeout]
 *   - {Object} [ctx] request context, default is `this.ctx`
 *
 * @api private
 */

proto.request = function* request(params) {
  var reqParams = this.createRequest(params);
  var result = yield this.urllib.request(reqParams.url, reqParams.params);
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

proto._getResource = function _getResource(params) {
  var resource = '/';
  if (params.bucket) resource += params.bucket + '/';
  if (params.object) resource += params.object;

  return resource;
};

proto._isIP = function _isIP(host) {
  var ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
  return ipv4Regex.test(host);
};

proto._escape = function _escape(name) {
  return utility.encodeURIComponent(name).replace(/%2F/g, '/');
}

proto._getReqUrl = function _getReqUrl(params) {
  var ep = {};
  copy(this.options.endpoint).to(ep);
  var isIP = this._isIP(ep.hostname);
  var isCname = this.options.cname;
  if (params.bucket && !isCname && !isIP) {
    ep.host = params.bucket + '.' + ep.host;
  }

  var path = '/';
  if (params.bucket && isIP) {
    path += params.bucket + '/';
  }

  if (params.object) {
    // Preserve '/' in result url
    path += this._escape(params.object);
  }
  ep.pathname = path;

  var query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    var subresAsQuery = {};
    if (is.string(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (is.array(params.subres)) {
      params.subres.forEach(function (k) {
        subresAsQuery[k] = '';
      });
    } else {
      subresAsQuery = params.subres;
    }
    merge(query, subresAsQuery);
  }

  ep.query = query;

  // As '%20' is not recognized by OSS server, we must convert it to '+'.
  return urlutil.format(ep).replace(/%20/g, '+');
};

/*
 * Get User-Agent for browser & node.js
 * @example
 *   aliyun-sdk-nodejs/4.1.2 Node.js 5.3.0 on Darwin 64-bit
 *   aliyun-sdk-js/4.1.2 Safari 9.0 on Apple iPhone(iOS 9.2.1)
 *   aliyun-sdk-js/4.1.2 Chrome 43.0.2357.134 32-bit on Windows Server 2008 R2 / 7 64-bit
 */

proto._userAgent = function _userAgent() {
  var agent =  (process && process.browser) ? 'js' : 'nodejs';
  var sdk = 'aliyun-sdk-' + agent + '/' + pkg.version;
  var plat = platform.description;

  return sdk + ' ' + plat;
};

/*
 * Check Browser And Version
 * @param {String} [name] browser name: like IE, Chrome, Firefox
 * @param {String} [version] browser major version: like 10(IE 10.x), 55(Chrome 55.x), 50(Firefox 50.x)
 * @return {Bool} true or false
 * @api private
 */

proto.checkBrowserAndVersion = function checkBrowserAndVersion(name, version) {
  return ((bowser.name == name) && (bowser.version.split('.')[0] == version));
};

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXML = function parseXMLThunk(str) {
  return function parseXML(done) {
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

proto.requestError = function* requestError(result) {
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

function setEndpoint(endpoint) {
  var url = urlutil.parse(endpoint);

  if (!url.protocol) {
    url = urlutil.parse('http://' + endpoint);
  }

  if (url.protocol != 'http:' && url.protocol != 'https:') {
    throw new Error('Endpoint protocol must be http or https.');
  }

  return url;
}

function setRegion(region, internal, secure) {
  var protocol = secure ? 'https://' : 'http://';
  var suffix = internal ? '-internal.aliyuncs.com' : '.aliyuncs.com';
  // aliyun VPC region: https://help.aliyun.com/knowledge_detail/38740.html
  if (region.startsWith('vpc100-oss-cn-')) {
    suffix = '.aliyuncs.com';
  }

  return urlutil.parse(protocol + region + suffix);
}
