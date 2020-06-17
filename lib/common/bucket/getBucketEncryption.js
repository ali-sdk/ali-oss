"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketEncryption = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */
async function getBucketEncryption(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('GET', bucketName, 'encryption', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    const encryption = result.data.ApplyServerSideEncryptionByDefault;
    return {
        encryption,
        status: result.status,
        res: result.res
    };
}
exports.getBucketEncryption = getBucketEncryption;
;
