"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucket = void 0;
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
async function putBucket(name, options = {}) {
    checkBucketName_1.checkBucketName(name, true);
    options = options || {};
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, '', options);
    const CreateBucketConfiguration = {};
    const paramlXMLObJ = {
        CreateBucketConfiguration,
    };
    const storageClass = options.StorageClass || options.storageClass;
    const dataRedundancyType = options.DataRedundancyType || options.dataRedundancyType;
    if (storageClass || dataRedundancyType) {
        storageClass && (CreateBucketConfiguration.StorageClass = storageClass);
        dataRedundancyType && (CreateBucketConfiguration.DataRedundancyType = dataRedundancyType);
        params.mime = 'xml';
        params.content = obj2xml_1.obj2xml(paramlXMLObJ, { headers: true });
    }
    const { acl, headers = {} } = options;
    acl && (headers['x-oss-acl'] = acl);
    params.headers = headers;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        bucket: (result.headers.location && result.headers.location.substring(1)) || null,
        res: result.res,
    };
}
exports.putBucket = putBucket;
