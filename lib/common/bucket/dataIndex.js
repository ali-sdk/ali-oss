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
  // console.log('aggRes', aggRes);
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
      let ossTaggingCount = 0;
      if (item.OSSTaggingCount && item.OSSTaggingCount.length > 0) ossTaggingCount = parseInt(item.OSSTaggingCount, 10);
      return {
        fileName: item.Filename,
        size: parseInt(item.Size, 10),
        fileModifiedTime: item.FileModifiedTime,
        ossObjectType: item.OSSObjectType,
        ossStorageClass: item.OSSStorageClass,
        objectACL: item.ObjectACL,
        eTag: item.ETag,
        ossTaggingCount,
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
    const getAggregationObject = item => {
      var _a;
      let groups = [];
      const { Groups } = item;
      if (Groups && Groups.Group) {
        const { Group } = Groups;
        if (Group instanceof Array) {
          groups = Group.map(group => {
            var _a;
            return {
              value: group.Value,
              count:
                ((_a = group.Count) === null || _a === void 0 ? void 0 : _a.length) > 0 ? parseInt(group.Count, 10) : 0
            };
          });
        } else if (Group instanceof Object) {
          groups = [
            {
              value: Group.Value,
              count:
                ((_a = Group.Count) === null || _a === void 0 ? void 0 : _a.length) > 0 ? parseInt(Group.Count, 10) : 0
            }
          ];
        }
      }
      return {
        field: item.Field,
        operation: item.Operation,
        value: item.Value ? parseFloat(item.Value) : 0,
        groups
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
