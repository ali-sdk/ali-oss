"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abortBucketWorm = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function abortBucketWorm(name, options) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('DELETE', name, 'worm', options);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.abortBucketWorm = abortBucketWorm;
