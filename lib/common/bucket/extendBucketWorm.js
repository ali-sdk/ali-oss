"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendBucketWorm = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
async function extendBucketWorm(name, wormId, days, options) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('POST', name, { wormExtend: '', wormId }, options);
    const paramlXMLObJ = {
        ExtendWormConfiguration: {
            RetentionPeriodInDays: days
        }
    };
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(paramlXMLObJ, { headers: true });
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.extendBucketWorm = extendBucketWorm;
