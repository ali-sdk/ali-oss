"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putStream = void 0;
const stream_1 = require("stream");
const pump_1 = __importDefault(require("pump"));
const objectName_1 = require("../../common/utils/objectName");
const convertMetaToHeaders_1 = require("../../common/utils/convertMetaToHeaders");
const objectUrl_1 = require("../../common/utils/objectUrl");
const encodeCallback_1 = require("../../common/utils/encodeCallback");
/**
 * put an object from ReadableStream. If `options.contentLength` is
 * not provided, chunked encoding is used.
 * @param {String} name the object key
 * @param {Readable} stream the ReadableStream
 * @param {Object} options
 * @return {Object}
 */
async function putStream(name, stream, options) {
    options = options || {};
    options.headers = options.headers || {};
    name = objectName_1.objectName(name);
    if (options.contentLength) {
        options.headers['Content-Length'] = options.contentLength;
    }
    else {
        options.headers['Transfer-Encoding'] = 'chunked';
    }
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    const method = options.method || 'PUT';
    const params = this._objectRequestParams(method, name, options);
    encodeCallback_1.encodeCallback(params, options);
    params.mime = options.mime;
    const transform = new stream_1.Transform();
    // must remove http stream header for signature
    transform._transform = function _transform(chunk, _encoding, done) {
        this.push(chunk);
        done();
    };
    params.stream = pump_1.default(stream, transform);
    params.successStatuses = [200];
    const result = await this.request(params);
    const ret = {
        name,
        url: objectUrl_1.objectUrl(name, this.options),
        res: result.res
    };
    if (params.headers && params.headers['x-oss-callback']) {
        ret.data = JSON.parse(result.data.toString());
    }
    return ret;
}
exports.putStream = putStream;
