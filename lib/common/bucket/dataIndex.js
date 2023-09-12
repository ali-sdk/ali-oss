"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeMetaQuery = exports.doMetaQuery = exports.getMetaQueryStatus = exports.openMetaQuery = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
async function openMetaQuery(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'add' }, options);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.openMetaQuery = openMetaQuery;
async function getMetaQueryStatus(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('GET', bucketName, 'metaQuery', options);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.getMetaQueryStatus = getMetaQueryStatus;
async function doMetaQuery(bucketName, queryParam, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'query' }, options);
    const { aggregations } = queryParam;
    let Aggregations;
    if (aggregations && aggregations.length > 0) {
        Aggregations = {
            Aggregation: aggregations.map(item => ({ Field: item.field, Operation: item.operation }))
        };
    }
    const paramXMLObj = {
        MetaQuery: {
            NextToken: queryParam.nextToken,
            MaxResults: queryParam.maxResults,
            Query: JSON.stringify(queryParam.query),
            Sort: queryParam.sort,
            Order: queryParam.order,
            Aggregations
        }
    };
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(paramXMLObj);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.doMetaQuery = doMetaQuery;
async function closeMetaQuery(bucketName, options = {}) {
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'delete' }, options);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.closeMetaQuery = closeMetaQuery;
