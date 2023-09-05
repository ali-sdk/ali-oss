"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBucketInventory = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const formatInventoryConfig_1 = require("../utils/formatInventoryConfig");
/**
 * listBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
async function listBucketInventory(bucketName, options = {}) {
    const { continuationToken } = options;
    const subres = Object.assign({ inventory: '' }, continuationToken && { 'continuation-token': continuationToken }, options.subres);
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('GET', bucketName, subres, options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    const { data, res, status } = result;
    return {
        isTruncated: data.IsTruncated === 'true',
        nextContinuationToken: data.NextContinuationToken,
        inventoryList: formatInventoryConfig_1.formatInventoryConfig(data.InventoryConfiguration, true),
        status,
        res
    };
}
exports.listBucketInventory = listBucketInventory;
