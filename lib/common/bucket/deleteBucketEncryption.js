"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketEncryption = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */
async function deleteBucketEncryption(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('DELETE', bucketName, 'encryption', options);
    params.successStatuses = [204];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.deleteBucketEncryption = deleteBucketEncryption;
