"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketPolicy = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
async function deleteBucketPolicy(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('DELETE', bucketName, 'policy', options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res
    };
}
exports.deleteBucketPolicy = deleteBucketPolicy;
;
