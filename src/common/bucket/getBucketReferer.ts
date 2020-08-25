import { checkBucketName } from '../utils/checkBucketName';
import { isArray } from '../utils/isArray';
import { RequestOptions } from '../../types/params';

export async function getBucketReferer(
  this: any,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'referer', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  let referers = result.data.RefererList.Referer || null;
  if (referers) {
    if (!isArray(referers)) {
      referers = [referers];
    }
  }
  return {
    allowEmpty: result.data.AllowEmptyReferer === 'true',
    referers,
    res: result.res,
  };
}
