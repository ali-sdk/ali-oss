"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketCORS = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isArray_1 = require("../utils/isArray");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function getBucketCORS(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('GET', name, 'cors', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    const rules = [];
    if (result.data && result.data.CORSRule) {
        let { CORSRule } = result.data;
        if (!isArray_1.isArray(CORSRule))
            CORSRule = [CORSRule];
        CORSRule.forEach(rule => {
            const r = {};
            Object.keys(rule).forEach(key => {
                r[key.slice(0, 1).toLowerCase() + key.slice(1, key.length)] = rule[key];
            });
            rules.push(r);
        });
    }
    return {
        rules,
        res: result.res,
    };
}
exports.getBucketCORS = getBucketCORS;
