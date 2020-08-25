import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */

export async function getBucketVersioning(
  this: any,
  bucketName: string,
  options: RequestOptions = {}
) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams(
    'GET',
    bucketName,
    'versioning',
    options
  );
  params.xmlResponse = true;
  params.successStatuses = [200];
  const result = await this.request(params);

  const versionStatus = result.data.Status;
  return {
    status: result.status,
    versionStatus,
    res: result.res,
  };
}
