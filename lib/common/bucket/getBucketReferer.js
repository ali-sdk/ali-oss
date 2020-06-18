"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketReferer = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isArray_1 = require("../utils/isArray");
async function getBucketReferer(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'referer', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    let referers = result.data.RefererList.Referer || null;
    if (referers) {
        if (!isArray_1.isArray(referers)) {
            referers = [referers];
        }
    }
    return {
        allowEmpty: result.data.AllowEmptyReferer === 'true',
        referers,
        res: result.res
    };
}
exports.getBucketReferer = getBucketReferer;
;
