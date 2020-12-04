"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports._request = void 0;
const debug_1 = __importDefault(require("debug"));
const parseXML_1 = require("../utils/parseXML");
const retry_1 = require("../utils/retry");
const setSTSToken_1 = require("../utils/setSTSToken");
const debug = debug_1.default('ali-oss');
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
async function _request(params) {
    const reqParams = this._createRequest(params);
    const isNode = this._getUserAgent().includes('nodejs');
    if (!isNode && !this.options.useFetch) {
        reqParams.params.mode = 'disable-fetch';
    }
    let result;
    let reqErr;
    const useStream = !!params.stream;
    try {
        result = await this.urllib.request(reqParams.url, reqParams.params);
        debug('response %s %s, got %s, headers: %j', params.method, reqParams.url, result.status, result.headers);
    }
    catch (err) {
        reqErr = err;
    }
    let err;
    if (result && params.successStatuses && params.successStatuses.indexOf(result.status) === -1) {
        err = await this.requestError(result);
        // not use stream
        if (err.code === 'RequestTimeTooSkewed' && !useStream && !isNode) {
            this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date().valueOf();
            return await this.request(params);
        }
        err.params = params;
    }
    else if (reqErr) {
        err = await this.requestError(reqErr);
    }
    if (err) {
        if (this.sendToWormhole && params.customResponse && result && result.res) {
            // consume the response stream
            await this.sendToWormhole(result.res);
        }
        if (err.status === 403 && err.code === 'InvalidAccessKeyId' &&
            this.options.accessKeyId.startsWith('STS.') &&
            typeof this.options.refreshSTSToken === 'function') {
            // prevent infinite loop, only trigger once within 10 seconds
            if (!this._setOptions || Date.now() - this._setOptions > 10000) {
                this._setOptions = Date.now();
                await setSTSToken_1.setSTSToken.call(this);
                return this.request(params);
            }
        }
        if (err.name === 'ResponseTimeoutError') {
            err.message = `${err.message.split(',')[0]}, please increase the timeout or use multipartDownload.`;
        }
        throw err;
    }
    if (params.xmlResponse) {
        result.data = await parseXML_1.parseXML(result.data);
    }
    return result;
}
exports._request = _request;
async function request(params) {
    const isAvailableStream = params.stream ? params.stream.readable : true;
    if (this.options.retryMax && isAvailableStream) {
        const requestfn = retry_1.retry(_request.bind(this), this.options.retryMax, {
            errorHandler: (err) => {
                const _errHandle = (_err) => {
                    const statusErr = [-1, -2].includes(_err.status);
                    const requestErrorRetryHandle = this.options.requestErrorRetryHandle || (() => true);
                    return statusErr && requestErrorRetryHandle(_err);
                };
                if (_errHandle(err))
                    return true;
                return false;
            }
        });
        return await requestfn(params);
    }
    else {
        return await _request.bind(this)(params);
    }
}
exports.request = request;
