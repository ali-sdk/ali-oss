"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketInventory = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const formatInventoryConfig_1 = require("../utils/formatInventoryConfig");
/**
 * getBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
async function getBucketInventory(bucketName, inventoryId, options = {}) {
    const subres = Object.assign({ inventory: '', inventoryId }, options.subres);
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('GET', bucketName, subres, options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
        inventory: formatInventoryConfig_1.formatInventoryConfig(result.data)
    };
}
exports.getBucketInventory = getBucketInventory;
