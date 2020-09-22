"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketWorm = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const dataFix_1 = require("../utils/dataFix");
async function getBucketWorm(name, options) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('GET', name, 'worm', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    dataFix_1.dataFix(result.data, {
        lowerFirst: true,
        rename: {
            RetentionPeriodInDays: 'days'
        }
    });
    return Object.assign(Object.assign({}, result.data), { res: result.res, status: result.status });
}
exports.getBucketWorm = getBucketWorm;
