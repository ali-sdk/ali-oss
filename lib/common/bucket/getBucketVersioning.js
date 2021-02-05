"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketVersioning = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */
async function getBucketVersioning(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = _bucketRequestParams_1._bucketRequestParams('GET', bucketName, 'versioning', options);
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    const versionStatus = result.data.Status;
    return {
        status: result.status,
        versionStatus,
        res: result.res,
    };
}
exports.getBucketVersioning = getBucketVersioning;
