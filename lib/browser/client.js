const debug = require('debug')('ali-oss');
const xml = require('xml2js');
const AgentKeepalive = require('agentkeepalive');
const merge = require('merge-descriptors');
const platform = require('platform');
const utility = require('utility');
const urllib = require('urllib');
const pkg = require('./version');
const bowser = require('bowser');
const signUtils = require('../common/signUtils');
const _initOptions = require('../common/client/initOptions');
const { createRequest } = require('../common/utils/createRequest');
const { encoder } = require('../common/utils/encoder');
const { getReqUrl } = require('../common/client/getReqUrl');
const { setSTSToken } = require('../common/utils/setSTSToken');
const { retry } = require('../common/utils/retry');
const { isFunction } = require('../common/utils/isFunction');

const globalHttpAgent = new AgentKeepalive();

function _unSupportBrowserTip() {
  const { name, version } = platform;
  if (name && name.toLowerCase && name.toLowerCase() === 'ie' && version.split('.')[0] < 10) {
    // eslint-disable-next-line no-console
    console.warn('ali-oss does not support the current browser');
  }
}
// check local web protocol,if https secure default set true , if http secure default set false
function isHttpsWebProtocol() {
  // for web worker not use window.location.
  // eslint-disable-next-line no-restricted-globals
  return location && location.protocol === 'https:';
}

function Client(options, ctx) {
  _unSupportBrowserTip();
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
  this.stsTokenFreshTime = new Date();

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
    useFetch: false,
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
/**
 * Bucket operations
 */
merge(proto, require('./bucket'));
merge(proto, require('../common/bucket/getBucketWebsite'));
merge(proto, require('../common/bucket/putBucketWebsite'));
merge(proto, require('../common/bucket/deleteBucketWebsite'));

// lifecycle
merge(proto, require('../common/bucket/getBucketLifecycle'));
merge(proto, require('../common/bucket/putBucketLifecycle'));
merge(proto, require('../common/bucket/deleteBucketLifecycle'));

// multiversion
merge(proto, require('../common/bucket/putBucketVersioning'));
merge(proto, require('../common/bucket/getBucketVersioning'));

// inventory
merge(proto, require('../common/bucket/getBucketInventory'));
merge(proto, require('../common/bucket/deleteBucketInventory'));
merge(proto, require('../common/bucket/listBucketInventory'));
merge(proto, require('../common/bucket/putBucketInventory'));

// worm
merge(proto, require('../common/bucket/abortBucketWorm'));
merge(proto, require('../common/bucket/completeBucketWorm'));
merge(proto, require('../common/bucket/extendBucketWorm'));
merge(proto, require('../common/bucket/getBucketWorm'));
merge(proto, require('../common/bucket/initiateBucketWorm'));

// multipart upload
merge(proto, require('./managed-upload'));
/**
 * common multipart-copy support node and browser
 */
merge(proto, require('../common/multipart-copy'));
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

  return signUtils.computeSignature(this.options.accessKeySecret, stringToSign, this.options.headerEncoding);
};

proto._getReqUrl = getReqUrl;

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

  return signUtils.authorization(this.options.accessKeyId, this.options.accessKeySecret, stringToSign, this.options.headerEncoding);
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

proto.request = async function (params) {
  if (this.options.retryMax) {
    return await retry(request.bind(this), this.options.retryMax, {
      errorHandler: (err) => {
        const _errHandle = (_err) => {
          if (params.stream) return false;
          const statusErr = [-1, -2].includes(_err.status);
          const requestErrorRetryHandle = this.options.requestErrorRetryHandle || (() => true);
          return statusErr && requestErrorRetryHandle(_err);
        };
        if (_errHandle(err)) return true;
        return false;
      }
    })(params);
  } else {
    return request.call(this, params);
  }
};

async function request(params) {
  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }
  const reqParams = createRequest.call(this, params);
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
}

proto._getResource = function _getResource(params) {
  let resource = '/';
  if (params.bucket) resource += `${params.bucket}/`;
  if (params.object) resource += encoder(params.object, this.options.headerEncoding);

  return resource;
};

proto._escape = function _escape(name) {
  return utility.encodeURIComponent(name).replace(/%2F/g, '/');
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

