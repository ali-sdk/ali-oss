"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketLocation = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function getBucketLocation(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    name = name || this.options.bucket;
    const params = this._bucketRequestParams('GET', name, 'location', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        location: result.data,
        res: result.res,
    };
}
exports.getBucketLocation = getBucketLocation;
