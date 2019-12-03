const debug = require('debug')('ali-oss');
const crypto = require('crypto');
const path = require('path');
const copy = require('copy-to');
const mime = require('mime');
const xml = require('xml2js');
const AgentKeepalive = require('agentkeepalive');
const merge = require('merge-descriptors');
const urlutil = require('url');
const is = require('is-type-of');
const platform = require('platform');
const utility = require('utility');
const urllib = require('urllib');
const pkg = require('./version');
const dateFormat = require('dateformat');
const bowser = require('bowser');
const signUtils = require('../common/signUtils');
const _isIP = require('../common/utils/isIP');
const _checkBucketName = require('../common/utils/checkBucketName');
const _initOptions = require('../common/client/initOptions');

const globalHttpAgent = new AgentKeepalive();

function getHeader(headers, name) {
  return headers[name] || headers[name.toLowerCase()];
}

// check local web protocol,if https secure default set true , if http secure default set false
function isHttpsWebProtocol() {
  // for web worker not use window.location.
  // eslint-disable-next-line no-restricted-globals
  return location && location.protocol === 'https:';
}

function Client(options, ctx) {
  if (!(this instanceof Client)) {
    return new Client(options, ctx);
  }
  if (options && options.inited) {
    this.options = options;
  } else {
    this.options = Client.initOptions(options);
  }

  this.options.cancelFlag = false;// cancel flag: if true need to be cancelled, default false

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = urllib;
    this.agent = this.options.agent || globalHttpAgent;
  }
  this.ctx = ctx;
  this.userAgent = this._getUserAgent();

  // record the time difference between client and server
  this.options.amendTimeSkewed = 0;
}

/**
 * Expose `Client`
 */

module.exports = Client;

Client.initOptions = function initOptions(options) {
  if (!options.stsToken) {
    console.warn('Please use STS Token for safety, see more details at https://help.aliyun.com/document_detail/32077.html');
  }
  const opts = Object.assign({
    secure: isHttpsWebProtocol(),
    // for browser compatibility disable fetch.
    useFetch: false
  }, options);

  return _initOptions(opts);
};


/**
 * prototype
 */

const proto = Client.prototype;

// mount debug on proto
proto.debug = debug;

/**
 * Object operations
 */
merge(proto, require('./object'));
// /**
//  * Bucket operations
//  */
/**
 * check Bucket Name
 */

proto._checkBucketName = function (name) {
  if (!_checkBucketName(name)) {
    throw new Error('The bucket must be conform to the specifications');
  }
};
// merge(proto, require('./bucket'));


// multipart upload
merge(proto, require('./managed-upload'));
/**
 * Multipart operations
 */
merge(proto, require('../common/multipart'));

/**
 * Common module parallel
 */
merge(proto, require('../common/parallel'));

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
proto.signature = function signature(stringToSign) {
  this.debug('authorization stringToSign: %s', stringToSign, 'info');

  return signUtils.computeSignature(this.options.accessKeySecret, stringToSign);
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
  const stringToSign = signUtils.buildCanonicalString(method.toUpperCase(), resource, {
    headers,
    parameters: subres
  });

  return signUtils.authorization(this.options.accessKeyId, this.options.accessKeySecret, stringToSign);
};

/**
 * create request params
 * See `request`
 * @api private
 */

proto.createRequest = function createRequest(params) {
  const headers = {
    'x-oss-date': dateFormat(+new Date() + this.options.amendTimeSkewed, 'UTC:ddd, dd mmm yyyy HH:MM:ss \'GMT\''),
    'x-oss-user-agent': this.userAgent
  };

  if (this.options.isRequestPay) {
    Object.assign(headers, { 'x-oss-request-payer': 'requester' });
  }

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
      headers['Content-Type'] = mime.getType(params.mime || path.extname(params.object || '')) || 'application/octet-stream';
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

  const authResource = this._getResource(params);
  headers.authorization = this.authorization(params.method, authResource, params.subres, headers);

  const url = this._getReqUrl(params);
  this.debug('request %s %s, with headers %j, !!stream: %s', params.method, url, headers, !!params.stream, 'info');
  const timeout = params.timeout || this.options.timeout;
  const reqParams = {
    agent: this.agent,
    method: params.method,
    content: params.content,
    stream: params.stream,
    headers,
    timeout,
    writeStream: params.writeStream,
    customResponse: params.customResponse,
    ctx: params.ctx || this.ctx
  };

  return {
    url,
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

proto.request = async function request(params) {
  const reqParams = this.createRequest(params);

  if (!this.options.useFetch) {
    reqParams.params.mode = 'disable-fetch';
  }
  let result;
  let reqErr;
  const useStream = !!params.stream;
  try {
    result = await this.urllib.request(reqParams.url, reqParams.params);
    this.debug('response %s %s, got %s, headers: %j', params.method, reqParams.url, result.status, result.headers, 'info');
  } catch (err) {
    reqErr = err;
  }
  let err;
  if (result && params.successStatuses && params.successStatuses.indexOf(result.status) === -1) {
    err = await this.requestError(result);
    // not use stream
    if (err.code === 'RequestTimeTooSkewed' && !useStream) {
      this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date();
      return await this.request(params);
    }
    err.params = params;
  } else if (reqErr) {
    err = await this.requestError(reqErr);
  }

  if (err) {
    throw err;
  }

  if (params.xmlResponse) {
    const parseData = await this.parseXML(result.data);
    result.data = parseData;
  }
  return result;
};

proto._getResource = function _getResource(params) {
  let resource = '/';
  if (params.bucket) resource += `${params.bucket}/`;
  if (params.object) resource += params.object;

  return resource;
};

proto._isIP = _isIP;

proto._escape = function _escape(name) {
  return utility.encodeURIComponent(name).replace(/%2F/g, '/');
};

proto._getReqUrl = function _getReqUrl(params) {
  const ep = {};
  copy(this.options.endpoint).to(ep);
  const isIP = this._isIP(ep.hostname);
  const isCname = this.options.cname;
  if (params.bucket && !isCname && !isIP) {
    ep.host = `${params.bucket}.${ep.host}`;
  }

  let reourcePath = '/';
  if (params.bucket && isIP) {
    reourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    reourcePath += this._escape(params.object).replace(/\+/g, '%2B');
  }
  ep.pathname = reourcePath;

  const query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if (is.string(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (is.array(params.subres)) {
      params.subres.forEach((k) => {
        subresAsQuery[k] = '';
      });
    } else {
      subresAsQuery = params.subres;
    }
    merge(query, subresAsQuery);
  }

  ep.query = query;

  return urlutil.format(ep);
};

/*
 * Get User-Agent for browser & node.js
 * @example
 *   aliyun-sdk-nodejs/4.1.2 Node.js 5.3.0 on Darwin 64-bit
 *   aliyun-sdk-js/4.1.2 Safari 9.0 on Apple iPhone(iOS 9.2.1)
 *   aliyun-sdk-js/4.1.2 Chrome 43.0.2357.134 32-bit on Windows Server 2008 R2 / 7 64-bit
 */

proto._getUserAgent = function _getUserAgent() {
  const agent = (process && process.browser) ? 'js' : 'nodejs';
  const sdk = `aliyun-sdk-${agent}/${pkg.version}`;
  let plat = platform.description;
  if (!plat && process) {
    plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
  }

  return this._checkUserAgent(`${sdk} ${plat}`);
};

proto._checkUserAgent = function _checkUserAgent(ua) {
  const userAgent = ua.replace(/\u03b1/, 'alpha').replace(/\u03b2/, 'beta');
  return userAgent;
};

/*
 * Check Browser And Version
 * @param {String} [name] browser name: like IE, Chrome, Firefox
 * @param {String} [version] browser major version: like 10(IE 10.x), 55(Chrome 55.x), 50(Firefox 50.x)
 * @return {Bool} true or false
 * @api private
 */

proto.checkBrowserAndVersion = function checkBrowserAndVersion(name, version) {
  return ((bowser.name === name) && (bowser.version.split('.')[0] === version));
};

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXML = function parseXMLThunk(str) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(str)) {
      str = str.toString();
    }
    xml.parseString(str, {
      explicitRoot: false,
      explicitArray: false
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * generater a request error with request response
 * @param {Object} result
 *
 * @api private
 */

proto.requestError = async function requestError(result) {
  let err = null;
  if (!result.data || !result.data.length) {
    if (result.status === -1 || result.status === -2) { // -1 is net error , -2 is timeout
      err = new Error(result.message);
      err.name = result.name;
      err.status = result.status;
      err.code = result.name;
    } else {
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
        err = new Error(`Unknow error, status: ${result.status}`);
        err.name = 'UnknowError';
        err.status = result.status;
      }
      err.requestId = result.headers['x-oss-request-id'];
      err.host = '';
    }
  } else {
    const message = String(result.data);
    this.debug('request response error data: %s', message, 'error');

    let info;
    try {
      info = await this.parseXML(message) || {};
    } catch (error) {
      this.debug(message, 'error');
      error.message += `\nraw xml: ${message}`;
      error.status = result.status;
      error.requestId = result.headers['x-oss-request-id'];
      return error;
    }

    let msg = info.Message || (`unknow request error, status: ${result.status}`);
    if (info.Condition) {
      msg += ` (condition: ${info.Condition})`;
    }
    err = new Error(msg);
    err.name = info.Code ? `${info.Code}Error` : 'UnknowError';
    err.status = result.status;
    err.code = info.Code;
    err.requestId = info.RequestId;
    err.hostId = info.HostId;
    err.serverTime = info.ServerTime;
  }

  this.debug('generate error %j', err, 'error');
  return err;
};

