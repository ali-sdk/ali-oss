"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketTags = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
/**
 * deleteBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 */
async function deleteBucketTags(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('DELETE', name, 'tagging', options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.deleteBucketTags = deleteBucketTags;
