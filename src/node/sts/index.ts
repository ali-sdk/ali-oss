import crypto from 'crypto';
import querystring from 'querystring';
import copy from 'copy-to';
import AgentKeepalive from 'agentkeepalive';
import is from 'is-type-of';
import ms from 'humanize-ms';
import urllib from 'urllib';

const debug = require('debug')('ali-oss:sts');

const globalHttpAgent = new AgentKeepalive();


class STS {
  public options;

  public urllib;

  public agent;

  public constructor(options: any = {}) {
    if (!options
      || !options.accessKeyId
      || !options.accessKeySecret) {
      throw new Error('require accessKeyId, accessKeySecret');
    }
  
    (this as any).options = {
      endpoint: options.endpoint || 'https://sts.aliyuncs.com',
      format: 'JSON',
      apiVersion: '2015-04-01',
      sigMethod: 'HMAC-SHA1',
      sigVersion: '1.0',
      timeout: '60s'
    };
    copy(options, false).to(this.options);
  
    // support custom agent and urllib client
    if (this.options.urllib) {
      this.urllib = this.options.urllib;
    } else {
      this.urllib = urllib;
      this.agent = this.options.agent || globalHttpAgent;
    }
  }

  async assumeRole(role, policy, expiration, session, options) {
    const opts = this.options;
    const params: any = {
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
      if ((is as any).string(policy)) {
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

  async _requestError(result) {
    const err: any = new Error();
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

  _getSignature(method, params, key) {
    const that = this;
    const canoQuery = Object.keys(params).sort().map(k => `${that._escape(k)}=${that._escape(params[k])}`).join('&');
  
    const stringToSign =
        `${method.toUpperCase()
        }&${this._escape('/')
        }&${this._escape(canoQuery)}`;
  
    debug('string to sign: %s', stringToSign);
  
    let signature: any = crypto.createHmac('sha1', `${key}&`);
    signature = signature.update(stringToSign).digest('base64');
  
    debug('signature: %s', signature);
  
    return signature;
  };

  _escape(str) {
    return encodeURIComponent(str).replace(/\*/g, '%2A');
  };
}

export default STS