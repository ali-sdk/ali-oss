import { checkBucketName } from '../utils/checkBucketName';

/**
 * getBucketStat
 * @param {String} name - bucket name
 * @return {Object}
 */

export async function getBucketStat(this: any, name: string, options: {}) {
  name = name || this.options.bucket;
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'stat', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);

  return {
    res: result.res,
    stat: result.data
  };
}
