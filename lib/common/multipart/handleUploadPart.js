"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadPart = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
async function handleUploadPart(name, uploadId, partNo, data, options = {}) {
    const opt = {};
    copy_to_1.default(options, false).to(opt);
    opt.headers = opt.headers || {};
    opt.headers['Content-Length'] = data.size;
    if (opt.headers)
        delete opt.headers['x-oss-server-side-encryption'];
    opt.subres = {
        partNumber: partNo,
        uploadId
    };
    const params = this._objectRequestParams('PUT', name, opt);
    params.mime = opt.mime;
    data.stream = data.stream.stream || data.stream;
    if (data.stream && data.stream.pipe) {
        params.stream = data.stream;
    }
    else {
        params.content = data.stream;
    }
    params.successStatuses = [200];
    const result = await this.request(params);
    if (!result.res.headers.etag) {
        throw new Error('Please set the etag of expose-headers in OSS \n https://help.aliyun.com/document_detail/32069.html');
    }
    data.stream = null;
    params.stream = null;
    return {
        name,
        etag: result.res.headers.etag,
        res: result.res
    };
}
exports.handleUploadPart = handleUploadPart;
