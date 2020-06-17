import { checkBucketName } from '../utils/checkBucketName';

/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function deleteBucketPolicy(this: any, bucketName, options: any = {}) {
  checkBucketName(bucketName);

  const params = this._bucketRequestParams('DELETE', bucketName, 'policy', options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res
  };
};
