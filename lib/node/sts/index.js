"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const querystring_1 = __importDefault(require("querystring"));
const copy_to_1 = __importDefault(require("copy-to"));
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const humanize_ms_1 = __importDefault(require("humanize-ms"));
const urllib_1 = __importDefault(require("urllib"));
const debug = require('debug')('ali-oss:sts');
const globalHttpAgent = new agentkeepalive_1.default();
class STS {
    constructor(options = {}) {
        if (!options || !options.accessKeyId || !options.accessKeySecret) {
            throw new Error('require accessKeyId, accessKeySecret');
        }
        this.options = {
            endpoint: options.endpoint || 'https://sts.aliyuncs.com',
            format: 'JSON',
            apiVersion: '2015-04-01',
            sigMethod: 'HMAC-SHA1',
            sigVersion: '1.0',
            timeout: '60s',
        };
        copy_to_1.default(options, false).to(this.options);
        // support custom agent and urllib client
        if (this.options.urllib) {
            this.urllib = this.options.urllib;
        }
        else {
            this.urllib = urllib_1.default;
            this.agent = this.options.agent || globalHttpAgent;
        }
    }
    async assumeRole(role, policy, expiration, session, options) {
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
            Timestamp: new Date().toISOString(),
        };
        if (policy) {
            let policyStr;
            if (is_type_of_1.default.string(policy)) {
                try {
                    policyStr = JSON.stringify(JSON.parse(policy));
                }
                catch (err) {
                    throw new Error(`Policy string is not a valid JSON: ${err.message}`);
                }
            }
            else {
                policyStr = JSON.stringify(policy);
            }
            params.Policy = policyStr;
        }
        const signature = this._getSignature('POST', params, opts.accessKeySecret);
        params.Signature = signature;
        const reqUrl = opts.endpoint;
        const reqParams = {
            agent: this.agent,
            timeout: humanize_ms_1.default((options && options.timeout) || opts.timeout),
            method: 'POST',
            content: querystring_1.default.stringify(params),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            ctx: options && options.ctx,
        };
        const result = await this.urllib.request(reqUrl, reqParams);
        debug('response %s %s, got %s, headers: %j', reqParams.method, reqUrl, result.status, result.headers);
        if (Math.floor(result.status / 100) !== 2) {
            const err = await this._requestError(result);
            err.params = reqParams;
            throw err;
        }
        result.data = JSON.parse(result.data);
        return {
            res: result.res,
            credentials: result.data.Credentials,
        };
    }
    async _requestError(result) {
        const err = new Error();
        err.status = result.status;
        try {
            const resp = (await JSON.parse(result.data)) || {};
            err.code = resp.Code;
            err.message = `${resp.Code}: ${resp.Message}`;
            err.requestId = resp.RequestId;
        }
        catch (e) {
            err.message = `UnknownError: ${String(result.data)}`;
        }
        return err;
    }
    _getSignature(method, params, key) {
        const that = this;
        const canoQuery = Object.keys(params)
            .sort()
            .map(k => `${that._escape(k)}=${that._escape(params[k])}`)
            .join('&');
        const stringToSign = `${method.toUpperCase()}&${this._escape('/')}&${this._escape(canoQuery)}`;
        debug('string to sign: %s', stringToSign);
        let signature = crypto_1.default.createHmac('sha1', `${key}&`);
        signature = signature.update(stringToSign).digest('base64');
        debug('signature: %s', signature);
        return signature;
    }
    _escape(str) {
        return encodeURIComponent(str).replace(/\*/g, '%2A');
    }
}
exports.default = STS;
