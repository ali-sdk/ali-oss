"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketACL = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function putBucketACL(name, acl, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, 'acl', options);
    params.headers = {
        'x-oss-acl': acl,
    };
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        bucket: (result.headers.location && result.headers.location.substring(1)) || null,
        res: result.res,
    };
}
exports.putBucketACL = putBucketACL;
