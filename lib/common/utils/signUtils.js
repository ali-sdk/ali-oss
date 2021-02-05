"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._signatureForURL = exports.computeSignature = exports.buildCanonicalString = exports.buildCanonicalizedResource = void 0;
const crypto_1 = __importDefault(require("crypto"));
const buffer_1 = require("buffer");
const lowercaseKeyHeader_1 = require("./lowercaseKeyHeader");
const isString_1 = require("./isString");
const isArray_1 = require("./isArray");
/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
function buildCanonicalizedResource(resourcePath, parameters) {
    let canonicalizedResource = `${resourcePath}`;
    let separatorString = '?';
    if (isString_1.isString(parameters) && parameters.trim() !== '') {
        canonicalizedResource += separatorString + parameters;
    }
    else if (isArray_1.isArray(parameters)) {
        parameters.sort();
        canonicalizedResource += separatorString + parameters.join('&');
    }
    else if (parameters) {
        const compareFunc = (entry1, entry2) => {
            if (entry1[0] > entry2[0]) {
                return 1;
            }
            else if (entry1[0] < entry2[0]) {
                return -1;
            }
            return 0;
        };
        const processFunc = (key) => {
            canonicalizedResource += separatorString + key;
            if (parameters[key]) {
                canonicalizedResource += `=${parameters[key]}`;
            }
            separatorString = '&';
        };
        Object.keys(parameters).sort(compareFunc).forEach(processFunc);
    }
    return canonicalizedResource;
}
exports.buildCanonicalizedResource = buildCanonicalizedResource;
/**
 * @param {String} method
 * @param {String} resourcePath
 * @param {Object} request
 * @param {String} expires
 * @return {String} canonicalString
 */
function buildCanonicalString(method, resourcePath, request, expires) {
    request = request || {};
    const headers = lowercaseKeyHeader_1.lowercaseKeyHeader(request.headers);
    const OSS_PREFIX = 'x-oss-';
    const ossHeaders = [];
    const headersToSign = {};
    let signContent = [
        method.toUpperCase(),
        headers['content-md5'] || '',
        headers['content-type'],
        expires || headers['x-oss-date']
    ];
    Object.keys(headers).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.indexOf(OSS_PREFIX) === 0) {
            headersToSign[lowerKey] = String(headers[key]).trim();
        }
    });
    Object.keys(headersToSign).sort().forEach((key) => {
        ossHeaders.push(`${key}:${headersToSign[key]}`);
    });
    signContent = signContent.concat(ossHeaders);
    signContent.push(buildCanonicalizedResource(resourcePath, request.parameters));
    return signContent.join('\n');
}
exports.buildCanonicalString = buildCanonicalString;
/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
function computeSignature(accessKeySecret, canonicalString, headerEncoding = 'utf-8') {
    const signature = crypto_1.default.createHmac('sha1', accessKeySecret);
    return signature.update(buffer_1.Buffer.from(canonicalString, headerEncoding)).digest('base64');
}
exports.computeSignature = computeSignature;
/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
function _signatureForURL(accessKeySecret, options = {}, resource, expires, headerEncoding) {
    const headers = {};
    const { subResource = {} } = options;
    if (options.process) {
        const processKeyword = 'x-oss-process';
        subResource[processKeyword] = options.process;
    }
    if (options.trafficLimit) {
        const trafficLimitKey = 'x-oss-traffic-limit';
        subResource[trafficLimitKey] = options.trafficLimit;
    }
    if (options.response) {
        Object.keys(options.response).forEach((k) => {
            const key = `response-${k.toLowerCase()}`;
            subResource[key] = options.response[k];
        });
    }
    Object.keys(options).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const value = options[key];
        if (lowerKey.indexOf('x-oss-') === 0) {
            headers[lowerKey] = value;
        }
        else if (lowerKey.indexOf('content-md5') === 0) {
            headers[key] = value;
        }
        else if (lowerKey.indexOf('content-type') === 0) {
            headers[key] = value;
        }
    });
    if (Object.prototype.hasOwnProperty.call(options, 'security-token')) {
        subResource['security-token'] = options['security-token'];
    }
    if (Object.prototype.hasOwnProperty.call(options, 'callback')) {
        const json = {
            callbackUrl: encodeURI(options.callback.url),
            callbackBody: options.callback.body
        };
        if (options.callback.host) {
            json.callbackHost = options.callback.host;
        }
        if (options.callback.contentType) {
            json.callbackBodyType = options.callback.contentType;
        }
        subResource.callback = buffer_1.Buffer.from(JSON.stringify(json)).toString('base64');
        if (options.callback.customValue) {
            const callbackVar = {};
            Object.keys(options.callback.customValue).forEach((key) => {
                callbackVar[`x:${key}`] = options.callback.customValue[key];
            });
            subResource['callback-var'] = buffer_1.Buffer.from(JSON.stringify(callbackVar)).toString('base64');
        }
    }
    const canonicalString = buildCanonicalString(options.method, resource, {
        headers,
        parameters: subResource
    }, expires.toString());
    return {
        Signature: computeSignature(accessKeySecret, canonicalString, headerEncoding),
        subResource
    };
}
exports._signatureForURL = _signatureForURL;
exports.default = {
    buildCanonicalizedResource,
    buildCanonicalString,
    computeSignature,
    _signatureForURL
};
