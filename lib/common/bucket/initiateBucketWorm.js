"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateBucketWorm = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const checkBucketName_1 = require("../utils/checkBucketName");
async function initiateBucketWorm(name, days, options) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('POST', name, 'worm', options);
    const paramlXMLObJ = {
        InitiateWormConfiguration: {
            RetentionPeriodInDays: days
        }
    };
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(paramlXMLObJ, { headers: true });
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
        wormId: result.res.headers['x-oss-worm-id'],
        status: result.status
    };
}
exports.initiateBucketWorm = initiateBucketWorm;
