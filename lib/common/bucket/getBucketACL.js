"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketACL = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
async function getBucketACL(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'acl', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    return {
        acl: result.data.AccessControlList.Grant,
        owner: {
            id: result.data.Owner.ID,
            displayName: result.data.Owner.DisplayName
        },
        res: result.res
    };
}
exports.getBucketACL = getBucketACL;
