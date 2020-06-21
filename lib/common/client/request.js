"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = void 0;
const debug_1 = __importDefault(require("debug"));
const parseXML_1 = require("../utils/parseXML");
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
async function request(params) {
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
        throw err;
    }
    if (params.xmlResponse) {
        result.data = await parseXML_1.parseXML(result.data);
    }
    return result;
}
exports.request = request;
;
