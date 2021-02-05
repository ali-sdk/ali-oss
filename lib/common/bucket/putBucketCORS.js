"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketCORS = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function putBucketCORS(name, rules = [], options = {}) {
    checkBucketName_1.checkBucketName(name);
    if (!rules.length) {
        throw new Error('rules is required');
    }
    rules.forEach(rule => {
        if (!rule.allowedOrigin) {
            throw new Error('allowedOrigin is required');
        }
        if (!rule.allowedMethod) {
            throw new Error('allowedMethod is required');
        }
    });
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, 'cors', options);
    const CORSRule = rules.map(_ => {
        const rule = {
            AllowedOrigin: _.allowedOrigin,
            AllowedMethod: _.allowedMethod,
            AllowedHeader: _.allowedHeader || '',
            ExposeHeader: _.exposeHeader || '',
        };
        if (_.maxAgeSeconds)
            rule.MaxAgeSeconds = _.maxAgeSeconds;
        return rule;
    });
    const parseXMLobj = {
        CORSConfiguration: {
            CORSRule,
        },
    };
    params.content = obj2xml_1.obj2xml(parseXMLobj, { headers: true });
    params.mime = 'xml';
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.putBucketCORS = putBucketCORS;
