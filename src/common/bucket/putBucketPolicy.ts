import { checkBucketName } from '../utils/checkBucketName';
import { policy2Str } from '../utils/policy2Str';
import { isObject } from '../utils/isObject';

/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */

export async function putBucketPolicy(
  this: any,
  bucketName: string,
  policy,
  options: any = {}
) {
  checkBucketName(bucketName);

  if (!isObject(policy)) {
    throw new Error('policy is not Object');
  }
  const params = this._bucketRequestParams(
    'PUT',
    bucketName,
    'policy',
    options
  );
  params.content = policy2Str(policy);
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
