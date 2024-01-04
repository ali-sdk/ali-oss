'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.closeMetaQuery = exports.doMetaQuery = exports.getMetaQueryStatus = exports.openMetaQuery = void 0;
/* eslint-disable max-len */
// https://help.aliyun.com/zh/oss/developer-reference/data-indexing
const checkBucketName_1 = require('../utils/checkBucketName');
const obj2xml_1 = require('../utils/obj2xml');
const formatObjKey_1 = require('../utils/formatObjKey');
async function openMetaQuery(bucketName, options = {}) {
  checkBucketName_1.checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'add' }, options);
  const result = await this.request(params);
  if (result.status === 200) {
    return {
      res: result.res,
      status: result.status
    };
  }
  throw await this.requestError(result);
}
exports.openMetaQuery = openMetaQuery;
async function getMetaQueryStatus(bucketName, options = {}) {
  checkBucketName_1.checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'metaQuery', options);
  const result = await this.request(params);
  if (result.status === 200) {
    const data = await this.parseXML(result.data);
    return {
      res: result.res,
      status: result.status,
      phase: data.Phase,
      state: data.State,
      createTime: data.CreateTime,
      updateTime: data.UpdateTime
    };
  }
  throw await this.requestError(result);
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
      Query: JSON.stringify(formatObjKey_1.formatObjKey(queryParam.query, 'firstUpperCase')),
      Sort: queryParam.sort,
      Order: queryParam.order,
      Aggregations
    }
  };
  params.mime = 'xml';
  params.content = obj2xml_1.obj2xml(paramXMLObj, { headers: true, firstUpperCase: true });
  const result = await this.request(params);
  if (result.status === 200) {
    const { NextToken, Files, Aggregations: aggRes } = await this.parseXML(result.data);
    let files;
    if (Files && Files.File) {
      const getFileObject = item => {
        var _a, _b;
        return {
          fileName: item.Filename,
          size: item.Size,
          fileModifiedTime: item.FileModifiedTime,
          ossObjectType: item.OSSObjectType,
          ossStorageClass: item.OSSStorageClass,
          objectACL: item.ObjectACL,
          eTag: item.ETag,
          ossTaggingCount: item.OSSTaggingCount,
          ossTagging:
            (_a = item.OSSTagging) === null || _a === void 0
              ? void 0
              : _a.map(tagging => ({
                  key: tagging.Key,
                  value: tagging.Value
                })),
          ossUserMeta:
            (_b = item.OSSUserMeta) === null || _b === void 0
              ? void 0
              : _b.map(meta => ({
                  key: meta.Key,
                  value: meta.Value
                })),
          ossCRC64: item.OSSCRC64,
          serverSideEncryption: item.ServerSideEncryption,
          serverSideEncryptionCustomerAlgorithm: item.ServerSideEncryptionCustomerAlgorithm
        };
      };
      if (Files.File instanceof Array) {
        files = Files.File.map(getFileObject);
      } else {
        files = [getFileObject(Files.File)];
      }
    }
    let aggList;
    if (aggRes) {
      const getAggregationObject = item => {
        var _a;
        return {
          field: item.Field,
          operation: item.Operation,
          value: item.Value,
          groups:
            (_a = item.Groups) === null || _a === void 0
              ? void 0
              : _a.map(group => ({
                  value: group.Value,
                  count: group.Count
                }))
        };
      };
      if (aggRes.Aggregation instanceof Array) {
        aggList = aggRes.Aggregation.map(getAggregationObject);
      } else {
        aggList = [getAggregationObject(aggRes.Aggregation)];
      }
    }
    return {
      res: result.res,
      status: result.status,
      nextToken: NextToken,
      files,
      aggregations: aggList
    };
  }
  throw await this.requestError(result);
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
