"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketInventory = void 0;
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * deleteBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
async function deleteBucketInventory(bucketName, inventoryId, options = {}) {
    const subres = Object.assign({ inventory: '', inventoryId }, options.subres);
    checkBucketName_1.checkBucketName(bucketName);
    const params = _bucketRequestParams_1._bucketRequestParams('DELETE', bucketName, subres, options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.deleteBucketInventory = deleteBucketInventory;
