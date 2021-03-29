"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const mime_1 = __importDefault(require("mime"));
const path_1 = __importDefault(require("path"));
const _objectRequestParams_1 = require("../../common/client/_objectRequestParams");
const convertMetaToHeaders_1 = require("../../common/utils/convertMetaToHeaders");
const encodeCallback_1 = require("../../common/utils/encodeCallback");
const isBlob_1 = require("../../common/utils/isBlob");
const isBuffer_1 = require("../../common/utils/isBuffer");
const isFile_1 = require("../../common/utils/isFile");
const objectName_1 = require("../../common/utils/objectName");
const objectUrl_1 = require("../../common/utils/objectUrl");
const _createBuffer_1 = require("../client/_createBuffer");
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
    options.disabledMD5 = options.disabledMD5 === undefined ? true : !!options.disabledMD5;
    name = objectName_1.objectName(name);
    if (isBuffer_1.isBuffer(file)) {
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
        content = await _createBuffer_1._createBuffer(file, 0, file.size);
        options.contentLength = await getFileSize_1.getFileSize(file);
    }
    else {
        throw new TypeError('Must provide Buffer/Blob/File for put.');
    }
    options.headers = options.headers || {};
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    const method = options.method || 'PUT';
    const params = _objectRequestParams_1._objectRequestParams.call(this, method, name, options);
    encodeCallback_1.encodeCallback(params, options);
    params.mime = options.mime;
    params.content = content;
    params.successStatuses = [200];
    params.disabledMD5 = options.disabledMD5;
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
