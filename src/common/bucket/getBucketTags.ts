import { checkBucketName } from '../utils/checkBucketName';
import { formatTag } from '../utils/formatTag';
import { RequestOptions } from '../../types/params';
import { GetBucketTagsReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */

export async function getBucketTags(
  this: Client,
  name: string,
  options: RequestOptions = {}
): Promise<GetBucketTagsReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('GET', name, 'tagging', options);
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
