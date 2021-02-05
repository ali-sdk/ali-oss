"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketPolicy = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const policy2Str_1 = require("../utils/policy2Str");
const isObject_1 = require("../utils/isObject");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */
async function putBucketPolicy(bucketName, policy, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    if (!isObject_1.isObject(policy)) {
        throw new Error('policy is not Object');
    }
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', bucketName, 'policy', options);
    params.content = policy2Str_1.policy2Str(policy);
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.putBucketPolicy = putBucketPolicy;
