import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function deleteBucketPolicy(
  this: Client,
  bucketName: string,
  options: RequestOptions = {}
): Promise<NormalSuccessResponseWithStatus> {
  checkBucketName(bucketName);

  const params = _bucketRequestParams(
    'DELETE',
    bucketName,
    'policy',
    options
  );
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res,
  };
}
