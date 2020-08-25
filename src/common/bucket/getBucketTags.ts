import { checkBucketName } from '../utils/checkBucketName';
import { formatTag } from '../utils/formatTag';
import { RequestOptions } from '../../types/params';

/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */

export async function getBucketTags(
  this: any,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'tagging', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const Tagging = result.data;

  return {
    status: result.status,
    res: result.res,
    tag: formatTag(Tagging),
  };
}
