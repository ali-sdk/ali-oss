import { checkBucketName } from '../utils/checkBucketName';
import { formatTag } from '../utils/formatTag';

/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */

export async function getBucketTags(this: any, name: string, options: any = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'tagging', options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const Tagging = await this.parseXML(result.data);

  return {
    status: result.status,
    res: result.res,
    tag: formatTag(Tagging)
  };
};
