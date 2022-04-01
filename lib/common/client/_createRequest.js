"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._createRequest = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mime_1 = __importDefault(require("mime"));
const dateformat_1 = __importDefault(require("dateformat"));
const copy_to_1 = __importDefault(require("copy-to"));
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const getResource_1 = require("../utils/getResource");
const authorization_1 = require("../utils/authorization");
const getReqUrl_1 = require("../utils/getReqUrl");
const encoder_1 = require("../utils/encoder");
const isIP_1 = require("../utils/isIP");
const initOptions_1 = require("./initOptions");
const _debug = debug_1.default('ali-oss');
function getHeader(headers, name) {
    return headers[name] || headers[name.toLowerCase()];
}
function delHeader(headers, name) {
    delete headers[name];
    delete headers[name.toLowerCase()];
}
function _createRequest(params) {
    let date = new Date();
    if (this.options.amendTimeSkewed) {
        date = +new Date() + this.options.amendTimeSkewed;
    }
    const headers = {
        'x-oss-date': dateformat_1.default(date, "UTC:ddd, dd mmm yyyy HH:MM:ss 'GMT'")
    };
    if (typeof window !== 'undefined') {
        headers['x-oss-user-agent'] = this.userAgent;
    }
    if (this.userAgent.includes('nodejs')) {
        headers['User-Agent'] = this.userAgent;
    }
    if (this.options.isRequestPay) {
        Object.assign(headers, { 'x-oss-request-payer': 'requester' });
    }
    if (this.options.stsToken) {
        headers['x-oss-security-token'] = this.options.stsToken;
    }
    copy_to_1.default(params.headers).to(headers);
    if (!getHeader(headers, 'Content-Type')) {
        if (params.mime && params.mime.indexOf('/') > 0) {
            headers['Content-Type'] = params.mime;
        }
        else {
            headers['Content-Type'] = mime_1.default.getType(params.mime || path_1.default.extname(params.object || ''));
        }
    }
    if (!getHeader(headers, 'Content-Type')) {
        delHeader(headers, 'Content-Type');
    }
    if (params.content) {
        if (!params.disabledMD5) {
            headers['Content-MD5'] = crypto_1.default.createHash('md5').update(Buffer.from(params.content, 'utf8')).digest('base64');
        }
        if (!headers['Content-Length']) {
            headers['Content-Length'] = params.content.length;
        }
    }
    const { hasOwnProperty } = Object.prototype;
    for (const k in headers) {
        if (headers[k] && hasOwnProperty.call(headers, k)) {
            headers[k] = encoder_1.encoder(String(headers[k]), this.options.headerEncoding);
        }
    }
    const authResource = getResource_1.getResource(params, this.options.headerEncoding);
    headers.authorization = authorization_1.authorization(params.method, authResource, params.subres, headers, this.options, this.options.headerEncoding);
    const url = getReqUrl_1.getReqUrl(params, this.options);
    if (isIP_1.isIP(this.options.endpoint.hostname)) {
        const { region, internal, secure } = this.options;
        const hostInfo = initOptions_1.setRegion(region, internal, secure);
        headers.host = `${params.bucket}.${hostInfo.host}`;
    }
    _debug('request %s %s, with headers %j, !!stream: %s', params.method, url, headers, !!params.stream);
    const timeout = params.timeout || this.options.timeout;
    const reqParams = {
        method: params.method,
        content: params.content,
        stream: params.stream,
        headers,
        timeout,
        writeStream: params.writeStream,
        customResponse: params.customResponse,
        ctx: params.ctx || this.ctx
    };
    if (this.agent) {
        reqParams.agent = this.agent;
    }
    if (this.httpsAgent) {
        reqParams.httpsAgent = this.httpsAgent;
    }
    reqParams.enableProxy = !!this.options.enableProxy;
    reqParams.proxy = this.options.proxy ? this.options.proxy : null;
    return {
        url,
        params: reqParams
    };
}
exports._createRequest = _createRequest;
