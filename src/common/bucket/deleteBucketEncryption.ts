import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */

export async function deleteBucketEncryption(this: Client, bucketName: string, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
  checkBucketName(bucketName);
  const params = _bucketRequestParams('DELETE', bucketName, 'encryption', options);
  params.successStatuses = [204];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
