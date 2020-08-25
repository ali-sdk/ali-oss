import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function getBucketPolicy(
  this: any,
  bucketName: string,
  options: RequestOptions = {}
) {
  checkBucketName(bucketName);

  const params = this._bucketRequestParams(
    'GET',
    bucketName,
    'policy',
    options
  );

  const result = await this.request(params);
  params.successStatuses = [200];
  let policy = null;

  if (result.res.status === 200) {
    policy = JSON.parse(result.res.data.toString());
  }

  return {
    policy,
    status: result.status,
    res: result.res,
  };
}
