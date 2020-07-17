"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucket = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
async function putBucket(name, options = {}) {
    checkBucketName_1.checkBucketName(name, true);
    options = options || {};
    const params = this._bucketRequestParams('PUT', name, '', options);
    const CreateBucketConfiguration = {};
    const paramlXMLObJ = {
        CreateBucketConfiguration,
    };
    if (options.StorageClass) {
        CreateBucketConfiguration.StorageClass = options.StorageClass;
        params.mime = 'xml';
        params.content = obj2xml_1.obj2xml(paramlXMLObJ, { headers: true });
    }
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        bucket: (result.headers.location && result.headers.location.substring(1)) || null,
        res: result.res,
    };
}
exports.putBucket = putBucket;
