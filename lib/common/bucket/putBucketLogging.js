"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketLogging = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function putBucketLogging(name, prefix = '', options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, 'logging', options);
    const parseXMLObj = {
        BucketLoggingStatus: {
            LoggingEnabled: {
                TargetBucket: name,
                TargetPrefix: prefix,
            },
        },
    };
    params.content = obj2xml_1.obj2xml(parseXMLObj, { headers: true });
    params.mime = 'xml';
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.putBucketLogging = putBucketLogging;
