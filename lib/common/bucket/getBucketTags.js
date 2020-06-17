"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketTags = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const formatTag_1 = require("../utils/formatTag");
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */
async function getBucketTags(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'tagging', options);
    params.successStatuses = [200];
    const result = await this.request(params);
    const Tagging = await this.parseXML(result.data);
    return {
        status: result.status,
        res: result.res,
        tag: formatTag_1.formatTag(Tagging)
    };
}
exports.getBucketTags = getBucketTags;
;
