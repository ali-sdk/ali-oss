/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (https://github.com/rockuw)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('ali-oss:sts');
var crypto = require('crypto');
var querystring = require('querystring');
var copy = require('copy-to');
var AgentKeepalive = require('agentkeepalive');

/*
 * Expose `STS`
 */

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
    endpoint: 'https://sts.aliyuncs.com',
    format: 'JSON',
    apiVersion: '2015-04-01',
    sigMethod: 'HMAC-SHA1',
    sigVersion: '1.0'
  };
  copy(options).to(this.options);

  this.urllib = require('urllib');
  this.agent = new AgentKeepalive();
};

var proto = STS.prototype;

/**
 * STS opertaions
 */

proto.assumeRole = function* (role, session, expiration) {
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

  var signature = this._getSignature('POST', params, opts.accessKeySecret);
  params['Signature'] = signature;

  var url = opts.endpoint;
  var options = {
    agent: this.agent,
    method: 'POST',
    content: querystring.stringify(params),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  var result = yield this.urllib.requestThunk(url, options);
  debug('response %s %s, got %s, headers: %j',
        options.method, url, result.status, result.headers);

  if (Math.floor(result.status / 100) !== 2) {
    var err = yield* this._requestError(result);
    err.params = options;
    throw err;
  }
  result.data = JSON.parse(result.data);

  return {
    res: result.res,
    credentials: result.data.Credentials
  };
};

proto._requestError = function* (result) {
  var err = new Error();
  err.status = result.status;

  try {
    var resp = yield JSON.parse(result.data) || {};
    err.code = resp.Code;
    err.message = resp.Code + ': ' + resp.Message;
    err.requestId = resp.RequestId;
  } catch (err) {
    err.message = 'UnknownError: ' + String(result.data);
  }

  return err;
};

proto._getSignature = function (method, params, key) {
  var canoQuery = Object.keys(params).sort().map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
  }).join('&');

  var stringToSign =
      method.toUpperCase() +
      '&' + encodeURIComponent('/') +
      '&' + encodeURIComponent(canoQuery);

  debug('string to sign: %s', stringToSign);

  var signature = crypto.createHmac('sha1', key + '&');
  signature = signature.update(stringToSign).digest('base64');

  debug('signature: %s', signature);

  return signature;
};
