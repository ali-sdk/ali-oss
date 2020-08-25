import { checkBucketName } from '../utils/checkBucketName';
import { isArray } from '../utils/isArray';
import { RequestOptions } from '../../types/params';

export async function getBucketCORS(
  this: any,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'cors', options);
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
