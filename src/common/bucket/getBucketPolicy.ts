import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketPolicyReturnType } from '../../types/bucket_policy';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function getBucketPolicy(
  this: Client,
  bucketName: string,
  options: RequestOptions = {}
): Promise<GetBucketPolicyReturnType> {
  checkBucketName(bucketName);

  const params = _bucketRequestParams(
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
