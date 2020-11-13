
const debug = require('debug')('ali-oss:sts');
const crypto = require('crypto');
const querystring = require('querystring');
const copy = require('copy-to');
const AgentKeepalive = require('agentkeepalive');
const is = require('is-type-of');
const ms = require('humanize-ms');
const urllib = require('urllib');

const globalHttpAgent = new AgentKeepalive();


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
}

module.exports = STS;

const proto = STS.prototype;

/**
 * STS opertaions
 */

proto.assumeRole = async function assumeRole(role, policy, expiration, session, options) {
  const opts = this.options;
  const params = {
    Action: 'AssumeRole',
    RoleArn: role,
    RoleSessionName: session || 'app',
    DurationSeconds: expiration || 3600,

    Format: opts.format,
    Version: opts.apiVersion,
    AccessKeyId: opts.accessKeyId,
    SignatureMethod: opts.sigMethod,
    SignatureVersion: opts.sigVersion,
    SignatureNonce: Math.random(),
    Timestamp: new Date().toISOString()
  };

  if (policy) {
    let policyStr;
    if (is.string(policy)) {
      try {
        policyStr = JSON.stringify(JSON.parse(policy));
      } catch (err) {
        throw new Error(`Policy string is not a valid JSON: ${err.message}`);
      }
    } else {
      policyStr = JSON.stringify(policy);
    }
    params.Policy = policyStr;
  }

  const signature = this._getSignature('POST', params, opts.accessKeySecret);
  params.Signature = signature;

  const reqUrl = opts.endpoint;
  const reqParams = {
    agent: this.agent,
    timeout: ms((options && options.timeout) || opts.timeout),
    method: 'POST',
    content: querystring.stringify(params),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    ctx: options && options.ctx
  };

  const result = await this.urllib.request(reqUrl, reqParams);
  debug(
    'response %s %s, got %s, headers: %j',
    reqParams.method, reqUrl, result.status, result.headers
  );

  if (Math.floor(result.status / 100) !== 2) {
    const err = await this._requestError(result);
    err.params = reqParams;
    throw err;
  }
  result.data = JSON.parse(result.data);

  return {
    res: result.res,
    credentials: result.data.Credentials
  };
};

proto._requestError = async function _requestError(result) {
  const err = new Error();
  err.status = result.status;

  try {
    const resp = await JSON.parse(result.data) || {};
    err.code = resp.Code;
    err.message = `${resp.Code}: ${resp.Message}`;
    err.requestId = resp.RequestId;
  } catch (e) {
    err.message = `UnknownError: ${String(result.data)}`;
  }

  return err;
};

proto._getSignature = function _getSignature(method, params, key) {
  const that = this;
  const canoQuery = Object.keys(params).sort().map(k => `${that._escape(k)}=${that._escape(params[k])}`).join('&');

  const stringToSign =
      `${method.toUpperCase()
      }&${this._escape('/')
      }&${this._escape(canoQuery)}`;

  debug('string to sign: %s', stringToSign);

  let signature = crypto.createHmac('sha1', `${key}&`);
  signature = signature.update(stringToSign).digest('base64');

  debug('signature: %s', signature);

  return signature;
};

/**
 * Since `encodeURIComponent` doesn't encode '*', which causes
 * 'SignatureDoesNotMatch'. We need do it ourselves.
 */
proto._escape = function _escape(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
};
