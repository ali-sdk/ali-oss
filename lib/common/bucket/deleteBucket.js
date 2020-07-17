"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucket = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function deleteBucket(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('DELETE', name, '', options);
    const result = await this.request(params);
    if (result.status === 200 || result.status === 204) {
        return {
            res: result.res,
        };
    }
    throw await this.requestError(result);
}
exports.deleteBucket = deleteBucket;
