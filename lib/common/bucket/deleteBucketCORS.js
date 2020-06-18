"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketCORS = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function deleteBucketCORS(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('DELETE', name, 'cors', options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.deleteBucketCORS = deleteBucketCORS;
;
