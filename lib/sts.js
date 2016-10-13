'use strict';

var debug = require('debug')('ali-oss:sts');
var crypto = require('crypto');
var querystring = require('querystring');
var copy = require('copy-to');
var AgentKeepalive = require('agentkeepalive');
var is = require('is-type-of');
var ms = require('humanize-ms');
var urllib = require('urllib');

var globalHttpAgent = new AgentKeepalive();

module.exports = STS;

function STS(options) {
  if (!(this instanceof STS)) {
    return new STS(options);
  }

  if (!options
    || !options.accessKeyId
    || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }

  this.options = {
    endpoint: options.endpoint || 'https://sts.aliyuncs.com',
    format: 'JSON',
    apiVersion: '2015-04-01',
    sigMethod: 'HMAC-SHA1',
    sigVersion: '1.0',
    timeout: '60s'
  };
  copy(options).to(this.options);

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = urllib;
    this.agent = this.options.agent || globalHttpAgent;
  }
};

var proto = STS.prototype;

/**
 * STS opertaions
 */

proto.assumeRole = function* assumeRole(role, policy, expiration, session, options) {
  var opts = this.options;
  var params = {
    'Action': 'AssumeRole',
    'RoleArn': role,
    'RoleSessionName': session || 'app',
    'DurationSeconds': expiration || 3600,

    'Format': opts.format,
    'Version': opts.apiVersion,
    'AccessKeyId': opts.accessKeyId,
    'SignatureMethod': opts.sigMethod,
    'SignatureVersion': opts.sigVersion,
    'SignatureNonce': Math.random(),
    'Timestamp': new Date().toISOString()
  };

  if (policy) {
    var policyStr;
    if (is.string(policy)) {
      try {
        policyStr = JSON.stringify(JSON.parse(policy));
      } catch (err) {
        throw new Error('Policy string is not a valid JSON: ' + err.message);
      }
    } else {
      policyStr = JSON.stringify(policy);
    }
    params.Policy = policyStr;
  }

  var signature = this._getSignature('POST', params, opts.accessKeySecret);
  params.Signature = signature;

  var reqUrl = opts.endpoint;
  var reqParams = {
    agent: this.agent,
    timeout: ms(options && options.timeout || opts.timeout),
    method: 'POST',
    content: querystring.stringify(params),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    ctx: options && options.ctx,
  };

  var result = yield this.urllib.request(reqUrl, reqParams);
  debug('response %s %s, got %s, headers: %j',
        reqParams.method, reqUrl, result.status, result.headers);

  if (Math.floor(result.status / 100) !== 2) {
    var err = yield this._requestError(result);
    err.params = reqParams;
    throw err;
  }
  result.data = JSON.parse(result.data);

  return {
    res: result.res,
    credentials: result.data.Credentials
  };
};

proto._requestError = function* _requestError(result) {
  var err = new Error();
  err.status = result.status;

  try {
    var resp = yield JSON.parse(result.data) || {};
    err.code = resp.Code;
    err.message = resp.Code + ': ' + resp.Message;
    err.requestId = resp.RequestId;
  } catch (e) {
    err.message = 'UnknownError: ' + String(result.data);
  }

  return err;
};

proto._getSignature = function _getSignature(method, params, key) {
  var that = this;
  var canoQuery = Object.keys(params).sort().map(function (key) {
    return that._escape(key) + '=' + that._escape(params[key])
  }).join('&');

  var stringToSign =
      method.toUpperCase() +
      '&' + this._escape('/') +
      '&' + this._escape(canoQuery);

  debug('string to sign: %s', stringToSign);

  var signature = crypto.createHmac('sha1', key + '&');
  signature = signature.update(stringToSign).digest('base64');

  debug('signature: %s', signature);

  return signature;
};

/**
 * Since `encodeURIComponent` doesn't encode '*', which causes
 * 'SignatureDoesNotMatch'. We need do it ourselves.
 */
proto._escape = function _escape(str) {
  return encodeURIComponent(str).replace(/\*/g, '%2A');
};
