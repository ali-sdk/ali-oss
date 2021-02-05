"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketRequestPayment = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
async function getBucketRequestPayment(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = _bucketRequestParams_1._bucketRequestParams('GET', bucketName, 'requestPayment', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
        payer: result.data.Payer,
    };
}
exports.getBucketRequestPayment = getBucketRequestPayment;
