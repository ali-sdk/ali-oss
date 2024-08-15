'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.closeMetaQuery = exports.doMetaQuery = exports.getMetaQueryStatus = exports.openMetaQuery = void 0;
// https://help.aliyun.com/zh/oss/developer-reference/data-indexing
// https://www.alibabacloud.com/help/en/oss/developer-reference/dometaquery
const checkBucketName_1 = require('../utils/checkBucketName');
const obj2xml_1 = require('../utils/obj2xml');
const formatObjKey_1 = require('../utils/formatObjKey');
async function openMetaQuery(bucketName, options = {}) {
  checkBucketName_1.checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'add' }, options);
  params.successStatuses = [200];
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
  params.successStatuses = [200];
  const result = await this.request(params);
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
exports.getMetaQueryStatus = getMetaQueryStatus;
var EOperation;
(function (EOperation) {
  EOperation['min'] = 'min';
  EOperation['max'] = 'max';
  EOperation['average'] = 'average';
  EOperation['sum'] = 'sum';
  EOperation['count'] = 'count';
  EOperation['distinct'] = 'distinct';
  EOperation['group'] = 'group';
})(EOperation || (EOperation = {}));
async function doMetaQuery(bucketName, queryParam, options = {}) {
  checkBucketName_1.checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'query' }, options);
  params.successStatuses = [200];
  const { aggregations } = queryParam;
  let aggregationsParam;
  if (aggregations && aggregations.length > 0) {
    aggregationsParam = {
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
      Aggregations: aggregationsParam
    }
  };
  params.mime = 'xml';
  params.content = obj2xml_1.obj2xml(paramXMLObj, { headers: true, firstUpperCase: true });
  const result = await this.request(params);
  const { NextToken, Files, Aggregations: aggRes } = await this.parseXML(result.data);
  // console.log('Files', JSON.stringify(Files));
  let files = [];
  if (Files && Files.File) {
    const getFileObject = item => {
      let ossTagging = [];
      const { OSSTagging } = item;
      if (OSSTagging && OSSTagging.Tagging) {
        const { Tagging } = OSSTagging;
        if (Tagging instanceof Array) {
          ossTagging = Tagging.map(tagging => ({
            key: tagging.Key,
            value: tagging.Value
          }));
        } else if (Tagging instanceof Object) {
          ossTagging = [{ key: Tagging.Key, vlaue: Tagging.Value }];
        }
      }
      let ossUserMeta = [];
      const { OSSUserMeta } = item;
      if (OSSUserMeta && OSSUserMeta.UserMeta) {
        const { UserMeta } = OSSUserMeta;
        if (UserMeta instanceof Array) {
          ossUserMeta = UserMeta.map(meta => ({
            key: meta.Key,
            value: meta.Value
          }));
        } else if (UserMeta instanceof Object) {
          ossUserMeta = [{ key: UserMeta.Key, vlaue: UserMeta.Value }];
        }
      }
      return {
        fileName: item.Filename,
        size: item.Size,
        fileModifiedTime: item.FileModifiedTime,
        ossObjectType: item.OSSObjectType,
        ossStorageClass: item.OSSStorageClass,
        objectACL: item.ObjectACL,
        eTag: item.ETag,
        ossTaggingCount: item.OSSTaggingCount || 0,
        ossTagging,
        ossUserMeta,
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
  let aggList = [];
  if (aggRes) {
    const getAggregationObject = item => ({
      field: item.Field,
      operation: item.Operation,
      value: item.Value,
      groups: item.Groups
        ? item.Groups.map(group => ({
            value: group.Value,
            count: group.Count
          }))
        : []
    });
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
exports.doMetaQuery = doMetaQuery;
async function closeMetaQuery(bucketName, options = {}) {
  checkBucketName_1.checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'delete' }, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
exports.closeMetaQuery = closeMetaQuery;
