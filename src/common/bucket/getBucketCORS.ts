import { checkBucketName } from '../utils/checkBucketName';
import { isArray } from '../utils/isArray';
import { RequestOptions } from '../../types/params';
import { GetBucketCORSReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketCORS(
  this: Client,
  name: string,
  options: RequestOptions = {}
):Promise<GetBucketCORSReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('GET', name, 'cors', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const rules: any = [];
  if (result.data && result.data.CORSRule) {
    let { CORSRule } = result.data;
    if (!isArray(CORSRule)) CORSRule = [CORSRule];
    CORSRule.forEach(rule => {
      const r = {};
      Object.keys(rule).forEach(key => {
        r[key.slice(0, 1).toLowerCase() + key.slice(1, key.length)] = rule[key];
      });
      rules.push(r);
    });
  }
  return {
    rules,
    res: result.res,
  };
}
