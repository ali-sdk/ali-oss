"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUploads = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
const _objectRequestParams_1 = require("../client/_objectRequestParams");
/**
 * List the on-going multipart uploads
 * https://help.aliyun.com/document_detail/31997.html
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
async function listUploads(query = {}, options = {}) {
    const opt = {};
    copy_to_1.default(options).to(opt);
    opt.subres = 'uploads';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', '', opt);
    params.query = query;
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    let uploads = result.data.Upload || [];
    if (!Array.isArray(uploads)) {
        uploads = [uploads];
    }
    uploads = uploads.map((up) => ({
        name: up.Key,
        uploadId: up.UploadId,
        initiated: up.Initiated
    }));
    return {
        res: result.res,
        uploads,
        bucket: result.data.Bucket,
        nextKeyMarker: result.data.NextKeyMarker,
        nextUploadIdMarker: result.data.NextUploadIdMarker,
        isTruncated: result.data.IsTruncated === 'true'
    };
}
exports.listUploads = listUploads;
