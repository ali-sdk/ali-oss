"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPartCopy = void 0;
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
/* eslint max-len: [0] */
async function uploadPartCopy(name, uploadId, partNo, range, sourceData, options = {}) {
    options.headers = options.headers || {};
    const versionId = options.versionId || (options.subres && options.subres.versionId) || null;
    let copySource;
    if (versionId) {
        copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}?versionId=${versionId}`;
    }
    else {
        copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}`;
    }
    options.headers['x-oss-copy-source'] = copySource;
    if (range) {
        options.headers['x-oss-copy-source-range'] = `bytes=${range}`;
    }
    options.subres = {
        partNumber: partNo,
        uploadId
    };
    const params = this._objectRequestParams('PUT', name, options);
    params.mime = options.mime;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        name,
        etag: result.res.headers.etag,
        res: result.res
    };
}
exports.uploadPartCopy = uploadPartCopy;
;
