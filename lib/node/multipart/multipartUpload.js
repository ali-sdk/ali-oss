"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipartUpload = void 0;
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
const initMultipartUpload_1 = require("../../common/multipart/initMultipartUpload");
const resumeMultipart_1 = require("../../common/multipart/resumeMultipart");
const putStream_1 = require("../object/putStream");
const isFile_1 = require("../../common/utils/isFile");
const getPartSize_1 = require("../../common/utils/getPartSize");
const convertMetaToHeaders_1 = require("../../common/utils/convertMetaToHeaders");
const getFileSize_1 = require("../utils/getFileSize");
/**
 * Upload a file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File} file
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url the OSS sends a callback request to this URL
 *        {String} options.callback.host The host header value for initiating callback requests
 *        {String} options.callback.body The value of the request body when a callback is initiated
 *        {String} options.callback.contentType The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 */
async function multipartUpload(name, file, options = {}) {
    this.resetCancelFlag();
    if (options.checkpoint && options.checkpoint.uploadId) {
        return await resumeMultipart_1.resumeMultipart.call(this, options.checkpoint, options);
    }
    const minPartSize = 100 * 1024;
    const filename = isFile_1.isFile(file) ? file.name : file;
    options.mime = options.mime || mime_1.default.getType(path_1.default.extname(filename));
    options.headers = options.headers || {};
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    const fileSize = await getFileSize_1.getFileSize(file);
    if (fileSize < minPartSize) {
        const stream = this._createStream(file, 0, fileSize);
        options.contentLength = fileSize;
        const result = await putStream_1.putStream.call(this, name, stream, options);
        if (options && options.progress) {
            await options.progress(1);
        }
        const ret = {
            res: result.res,
            bucket: this.options.bucket,
            name,
            etag: result.res.headers.etag
        };
        if ((options.headers && options.headers['x-oss-callback']) || options.callback) {
            ret.data = result.data;
        }
        return ret;
    }
    if (options.partSize && !(parseInt(options.partSize, 10) === options.partSize)) {
        throw new Error('partSize must be int number');
    }
    if (options.partSize && options.partSize < minPartSize) {
        throw new Error(`partSize must not be smaller than ${minPartSize}`);
    }
    const initResult = await initMultipartUpload_1.initMultipartUpload.call(this, name, options);
    const { uploadId } = initResult;
    const partSize = getPartSize_1.getPartSize(fileSize, options.partSize);
    const checkpoint = {
        file,
        name,
        fileSize,
        partSize,
        uploadId,
        doneParts: []
    };
    if (options && options.progress) {
        await options.progress(0, checkpoint, initResult.res);
    }
    return await resumeMultipart_1.resumeMultipart.call(this, checkpoint, options);
}
exports.multipartUpload = multipartUpload;
