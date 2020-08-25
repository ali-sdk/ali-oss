"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putStream = void 0;
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
async function putStream(name, stream, options = {}) {
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
    params.stream = stream;
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
