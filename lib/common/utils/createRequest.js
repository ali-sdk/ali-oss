"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = void 0;
const crypto = require('crypto');
const debug = require('debug')('ali-oss');
const _isString = require('lodash/isString');
const _isArray = require('lodash/isArray');
const _isObject = require('lodash/isObject');
const mime = require('mime');
const dateFormat = require('dateformat');
const copy = require('copy-to');
const path = require('path');
const { encoder } = require('./encoder');
const { isIP } = require('./isIP');
const { setRegion } = require('./setRegion');
const { getReqUrl } = require('../client/getReqUrl');
const { isDingTalk } = require('./isDingTalk');
function getHeader(headers, name) {
    return headers[name] || headers[name.toLowerCase()];
}
function delHeader(headers, name) {
    delete headers[name];
    delete headers[name.toLowerCase()];
}
function createRequest(params) {
    let date = new Date();
    if (this.options.amendTimeSkewed) {
        date = +new Date() + this.options.amendTimeSkewed;
    }
    const headers = {
        'x-oss-date': dateFormat(date, this.options.authorizationV4 ? "UTC:yyyymmdd'T'HHMMss'Z'" : "UTC:ddd, dd mmm yyyy HH:MM:ss 'GMT'")
    };
    if (this.options.authorizationV4) {
        headers['x-oss-content-sha256'] = 'UNSIGNED-PAYLOAD';
    }
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
    copy(params.headers).to(headers);
    if (!getHeader(headers, 'Content-Type')) {
        if (params.mime && params.mime.indexOf('/') > 0) {
            headers['Content-Type'] = params.mime;
        }
        else if (isDingTalk()) {
            headers['Content-Type'] = 'application/octet-stream';
        }
        else {
            headers['Content-Type'] = mime.getType(params.mime || path.extname(params.object || ''));
        }
    }
    if (!getHeader(headers, 'Content-Type')) {
        delHeader(headers, 'Content-Type');
    }
    if (params.content) {
        if (!params.disabledMD5) {
            if (!params.headers || !params.headers['Content-MD5']) {
                headers['Content-MD5'] = crypto.createHash('md5').update(Buffer.from(params.content, 'utf8')).digest('base64');
            }
            else {
                headers['Content-MD5'] = params.headers['Content-MD5'];
            }
        }
        if (!headers['Content-Length']) {
            headers['Content-Length'] = params.content.length;
        }
    }
    const { hasOwnProperty } = Object.prototype;
    for (const k in headers) {
        if (headers[k] && hasOwnProperty.call(headers, k)) {
            headers[k] = encoder(String(headers[k]), this.options.headerEncoding);
        }
    }
    const queries = {};
    if (_isString(params.subres)) {
        queries[params.subres] = null;
    }
    else if (_isArray(params.subres)) {
        params.subres.forEach(v => {
            queries[v] = null;
        });
    }
    else if (_isObject(params.subres)) {
        Object.entries(params.subres).forEach(v => {
            queries[v[0]] = v[1] === '' ? null : v[1];
        });
    }
    if (_isObject(params.query)) {
        Object.entries(params.query).forEach(v => {
            queries[v[0]] = v[1];
        });
    }
    headers.authorization = this.options.authorizationV4
        ? this.authorizationV4(params.method, {
            headers,
            queries
        }, params.bucket, params.object, params.additionalHeaders)
        : this.authorization(params.method, this._getResource(params), params.subres, headers, this.options.headerEncoding);
    // const url = this._getReqUrl(params);
    if (isIP(this.options.endpoint.hostname)) {
        const { region, internal, secure } = this.options;
        const hostInfo = setRegion(region, internal, secure);
        headers.host = `${params.bucket}.${hostInfo.host}`;
    }
    const url = getReqUrl.bind(this)(params);
    debug('request %s %s, with headers %j, !!stream: %s', params.method, url, headers, !!params.stream);
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
exports.createRequest = createRequest;
