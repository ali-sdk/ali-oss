import { checkBucketName } from '../utils/checkBucketName';

/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */

export async function deleteBucketEncryption(this: any, bucketName) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams('DELETE', bucketName, 'encryption');
  params.successStatuses = [204];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
