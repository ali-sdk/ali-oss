import { checkBucketName } from '../utils/checkBucketName';
import { isArray } from '../utils/isArray';
import { RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketReferer(
  this: Client,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = _bucketRequestParams('GET', name, 'referer', options);
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
