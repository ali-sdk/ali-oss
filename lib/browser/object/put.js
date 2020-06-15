"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const putStream_1 = require("./putStream");
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const objectName_1 = require("../../common/utils/objectName");
const encodeCallback_1 = require("../../common/utils/encodeCallback");
const objectUrl_1 = require("../../common/utils/objectUrl");
const objectRequestParams_1 = require("../../common/utils/objectRequestParams");
const convertMetaToHeaders_1 = require("../../common/utils/convertMetaToHeaders");
const getFileSize_1 = require("../utils/getFileSize");
/**
 * put an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url  the OSS sends a callback request to this URL
 *        {String} options.callback.host  The host header value for initiating callback requests
 *        {String} options.callback.body  The value of the request body when a callback is initiated
 *        {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 * @return {Object}
 */
async function put(name, file, options = {}) {
    let content;
    name = objectName_1.objectName(name);
    if (is_type_of_1.default.buffer(file)) {
        content = file;
    }
    else if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        if (!options.mime) {
            if (isFile_1.isFile(file)) {
                options.mime = mime_1.default.getType(path_1.default.extname(file.name));
            }
            else {
                options.mime = file.type;
            }
        }
        const stream = this._createStream(file, 0, file.size);
        options.contentLength = await getFileSize_1.getFileSize(file);
        try {
            const result = await putStream_1.putStream.call(this, name, stream, options);
            return result;
        }
        catch (err) {
            if (err.code === 'RequestTimeTooSkewed') {
                this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date().valueOf();
                return await put.call(this, name, file, options);
            }
        }
    }
    else {
        throw new TypeError('Must provide Buffer/Blob/File for put.');
    }
    options.headers = options.headers || {};
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    const method = options.method || 'PUT';
    const params = objectRequestParams_1.objectRequestParams(method, name, this.options.bucket, options);
    encodeCallback_1.encodeCallback(params, options);
    params.mime = options.mime;
    params.content = content;
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
exports.put = put;
