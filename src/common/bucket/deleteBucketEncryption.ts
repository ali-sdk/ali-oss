import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { PutBucketEncryptionReturnType } from '../../types/bucket';

/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */

export async function deleteBucketEncryption(this: any, bucketName: string, options: RequestOptions = {}): Promise<PutBucketEncryptionReturnType> {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('DELETE', bucketName, 'encryption', options);
  params.successStatuses = [204];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
