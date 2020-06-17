"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketLifecycle = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isArray_1 = require("../utils/isArray");
const formatObjKey_1 = require("../utils/formatObjKey");
async function getBucketLifecycle(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'lifecycle', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    let rules = result.data.Rule || null;
    if (rules) {
        if (!isArray_1.isArray(rules)) {
            rules = [rules];
        }
        rules = rules.map((_) => {
            if (_.ID) {
                _.id = _.ID;
                delete _.ID;
            }
            if (_.Tag && !isArray_1.isArray(_.Tag)) {
                _.Tag = [_.Tag];
            }
            return formatObjKey_1.formatObjKey(_, 'firstLowerCase');
        });
    }
    return {
        rules,
        res: result.res
    };
}
exports.getBucketLifecycle = getBucketLifecycle;
;
