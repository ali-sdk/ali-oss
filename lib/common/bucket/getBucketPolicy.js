"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketPolicy = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
async function getBucketPolicy(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('GET', bucketName, 'policy', options);
    const result = await this.request(params);
    params.successStatuses = [200];
    let policy = null;
    if (result.res.status === 200) {
        policy = JSON.parse(result.res.data.toString());
    }
    return {
        policy,
        status: result.status,
        res: result.res,
    };
}
exports.getBucketPolicy = getBucketPolicy;
