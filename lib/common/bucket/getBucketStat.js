"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketStat = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function getBucketStat(name, options) {
    name = name || this.options.bucket;
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'stat', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        res: result.res,
        stat: result.data
    };
}
exports.getBucketStat = getBucketStat;
