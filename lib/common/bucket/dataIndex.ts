// https://help.aliyun.com/zh/oss/developer-reference/data-indexing
import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { formatObjKey } from '../utils/formatObjKey';

export async function openMetaQuery(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'add' }, options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}

export async function getMetaQueryStatus(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'metaQuery', options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}

interface ISubQuerie {
  // https://help.aliyun.com/zh/oss/developer-reference/appendix-supported-fields-and-operators
  field?: string;
  value?: string;
  // 操作符。取值范围为eq（等于）、gt（大于）、gte（大于等于）、lt（小于）、 lte（小于等于）、match（模糊查询）、prefix（前缀查询）、and（逻辑与）、or（逻辑或）和not（逻辑非）。
  operation: string;
  subQueries?: ISubQuerie[];
}

interface IAggregation {
  field: string;
  operation: string;
}

interface IMetaQuery {
  nextToken?: string;
  maxResults?: number;
  query: ISubQuerie;
  sort?: string;
  order?: 'asc' | 'desc';
  aggregations?: IAggregation[];
}

export async function doMetaQuery(this: any, bucketName: string, queryParam: IMetaQuery, options = {}) {
  checkBucketName(bucketName);
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
      Query: JSON.stringify(formatObjKey(queryParam.query, 'firstUpperCase')),
      Sort: queryParam.sort,
      Order: queryParam.order,
      Aggregations
    }
  };
  params.mime = 'xml';
  params.content = obj2xml(paramXMLObj, { headers: true, firstUpperCase: true });

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}

export async function closeMetaQuery(this: any, bucketName: string, options = {}) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('POST', bucketName, { metaQuery: '', comp: 'delete' }, options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
