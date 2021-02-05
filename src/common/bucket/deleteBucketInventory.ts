import { Client } from '../../setConfig';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { checkBucketName } from '../utils/checkBucketName';

/**
 * deleteBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
export async function deleteBucketInventory(this: Client, bucketName: string, inventoryId: string, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
  const subres: any = Object.assign({ inventory: '', inventoryId }, options.subres);
  checkBucketName(bucketName);

  const params = _bucketRequestParams('DELETE', bucketName, subres, options);
  params.successStatuses = [204];

  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
