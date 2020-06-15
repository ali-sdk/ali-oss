"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = void 0;
const crypto = require('crypto');
const debug = require('debug')('ali-oss');
const mime = require('mime');
const dateFormat = require('dateformat');
const copy = require('copy-to');
const path = require('path');
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
        'x-oss-date': dateFormat(date, 'UTC:ddd, dd mmm yyyy HH:MM:ss \'GMT\''),
        'x-oss-user-agent': this.userAgent
    };
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
        else {
            headers['Content-Type'] = mime.getType(params.mime || path.extname(params.object || ''));
        }
    }
    if (!getHeader(headers, 'Content-Type')) {
        delHeader(headers, 'Content-Type');
    }
    if (params.content) {
        headers['Content-Md5'] = crypto
            .createHash('md5')
            .update(Buffer.from(params.content, 'utf8'))
            .digest('base64');
        if (!headers['Content-Length']) {
            headers['Content-Length'] = params.content.length;
        }
    }
    const authResource = this._getResource(params);
    headers.authorization = this.authorization(params.method, authResource, params.subres, headers);
    const url = this._getReqUrl(params);
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
    return {
        url,
        params: reqParams
    };
}
exports.createRequest = createRequest;
