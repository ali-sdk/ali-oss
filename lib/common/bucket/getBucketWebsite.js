"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketWebsite = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isObject_1 = require("../utils/isObject");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function getBucketWebsite(name, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('GET', name, 'website', options);
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    let routingRules = [];
    if (result.data.RoutingRules && result.data.RoutingRules.RoutingRule) {
        if (isObject_1.isObject(result.data.RoutingRules.RoutingRule)) {
            routingRules = [result.data.RoutingRules.RoutingRule];
        }
        else {
            routingRules = result.data.RoutingRules.RoutingRule;
        }
    }
    return {
        index: (result.data.IndexDocument && result.data.IndexDocument.Suffix) || '',
        supportSubDir: (result.data.IndexDocument && result.data.IndexDocument.SupportSubDir) ||
            'false',
        type: result.data.IndexDocument && result.data.IndexDocument.Type,
        routingRules,
        error: (result.data.ErrorDocument && result.data.ErrorDocument.Key) || null,
        res: result.res,
    };
}
exports.getBucketWebsite = getBucketWebsite;
