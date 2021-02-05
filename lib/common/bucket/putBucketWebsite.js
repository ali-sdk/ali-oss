"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketWebsite = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
const isArray_1 = require("../utils/isArray");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function putBucketWebsite(name, config = { index: 'index.html' }, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, 'website', options);
    const IndexDocument = {
        Suffix: config.index || 'index.html',
    };
    const WebsiteConfiguration = {
        IndexDocument,
    };
    let website = {
        WebsiteConfiguration,
    };
    if (config.supportSubDir) {
        IndexDocument.SupportSubDir = config.supportSubDir;
    }
    if (config.type) {
        IndexDocument.Type = config.type;
    }
    if (config.error) {
        WebsiteConfiguration.ErrorDocument = {
            Key: config.error,
        };
    }
    if (config.routingRules !== undefined) {
        if (!isArray_1.isArray(config.routingRules)) {
            throw new Error('RoutingRules must be Array');
        }
        WebsiteConfiguration.RoutingRules = {
            RoutingRule: config.routingRules,
        };
    }
    website = obj2xml_1.obj2xml(website);
    params.content = website;
    params.mime = 'xml';
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.putBucketWebsite = putBucketWebsite;
