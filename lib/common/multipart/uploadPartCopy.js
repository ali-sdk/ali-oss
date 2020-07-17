"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPartCopy = void 0;
const deepCopy_1 = require("../utils/deepCopy");
/**
 * Upload a part copy in a multipart from the source bucket/object
 * used with initMultipartUpload and completeMultipartUpload.
 * @param {String} name copy object name
 * @param {String} uploadId the upload id
 * @param {Number} partNo the part number
 * @param {String} range  like 0-102400  part size need to copy
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 * @param {Object} options
 */
async function uploadPartCopy(name, uploadId, partNo, range, sourceData, options = {}) {
    const opt = deepCopy_1.deepCopy(options);
    opt.headers = opt.headers || {};
    const versionId = opt.versionId || (opt.subres && opt.subres.versionId) || null;
    let copySource;
    if (versionId) {
        copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}?versionId=${versionId}`;
    }
    else {
        copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}`;
    }
    opt.headers['x-oss-copy-source'] = copySource;
    if (range)
        opt.headers['x-oss-copy-source-range'] = `bytes=${range}`;
    if (opt.headers)
        delete opt.headers['x-oss-server-side-encryption'];
    opt.subres = {
        partNumber: partNo,
        uploadId,
    };
    const params = this._objectRequestParams('PUT', name, opt);
    params.mime = opt.mime;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        name,
        etag: result.res.headers.etag,
        res: result.res,
    };
}
exports.uploadPartCopy = uploadPartCopy;
