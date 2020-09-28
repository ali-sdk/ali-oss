"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeBucketWorm = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function completeBucketWorm(name, wormId, options) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('POST', name, { wormId }, options);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.completeBucketWorm = completeBucketWorm;
