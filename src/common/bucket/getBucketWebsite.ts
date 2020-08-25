import { checkBucketName } from '../utils/checkBucketName';
import { isObject } from '../utils/isObject';
import { RequestOptions } from '../../types/params';

export async function getBucketWebsite(
  this: any,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'website', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  let routingRules: any[] = [];
  if (result.data.RoutingRules && result.data.RoutingRules.RoutingRule) {
    if (isObject(result.data.RoutingRules.RoutingRule)) {
      routingRules = [result.data.RoutingRules.RoutingRule];
    } else {
      routingRules = result.data.RoutingRules.RoutingRule;
    }
  }
  return {
    index:
      (result.data.IndexDocument && result.data.IndexDocument.Suffix) || '',
    supportSubDir:
      (result.data.IndexDocument && result.data.IndexDocument.SupportSubDir) ||
      'false',
    type: result.data.IndexDocument && result.data.IndexDocument.Type,
    routingRules,
    error: (result.data.ErrorDocument && result.data.ErrorDocument.Key) || null,
    res: result.res,
  };
}
