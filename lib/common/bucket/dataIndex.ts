/* eslint-disable max-len */
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

// https://help.aliyun.com/zh/oss/developer-reference/appendix-supported-fields-and-operators
interface ISubQuerie {
  // the fields. For more information about supported fields and supported operators
  field?: string;
  // the value of the field.
  value?: string;
  // the operators. Valid values: eq (equal to), gt (greater than), gte (greater than or equal to), lt (less than), lte (less than or equal to), match (fuzzy query), prefix (prefix query), and (AND), or (OR), and not (NOT).
  operation: string;
  // the subquery conditions. Options that are included in this element are the same as those of simple query. You must set subquery conditions only when Operation is set to AND, OR, or NOT.
  subQueries?: ISubQuerie[];
}

interface IAggregation {
  // The name of the field. For more information about supported fields and supported operators
  field: string;
  // The operator for aggregate operations. Valid values:min,max,average,sum,count,distinct,group
  operation: string;
}

interface IMetaQuery {
  // The token that is used for the next query when the total number of objects exceeds the value of MaxResults. The object information is returned in alphabetical order starting from the value of NextToken. When this operation is called for the first time, set this field to null.
  nextToken?: string;
  // The maximum number of objects to return. Valid values: 0 to 100. If this parameter is not set or is set to 0, 100 objects are returned.
  maxResults?: number;
  query: ISubQuerie;
  // The field based on which the results are sorted. For more information about the fields that can be sorted
  sort?: string;
  // The order in which you want to sort the queried data. Default value: desc.
  order?: 'asc' | 'desc';
  // The container for the information about aggregate operations.
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
