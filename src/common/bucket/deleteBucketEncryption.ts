import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */

export async function deleteBucketEncryption(this: any, bucketName: string, options: RequestOptions = {}) {
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
