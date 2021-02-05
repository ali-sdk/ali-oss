import { Client } from '../../setConfig';
import { ListBucketInventoryReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { checkBucketName } from '../utils/checkBucketName';
import { formatInventoryConfig } from '../utils/formatInventoryConfig';
/**
 * listBucketInventory
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function listBucketInventory(this: Client, bucketName: string, options: any = {}): Promise<ListBucketInventoryReturnType> {
  const { continuationToken } = options;
  const subres: any = Object.assign({ inventory: '' }, continuationToken && { 'continuation-token': continuationToken }, options.subres);
  checkBucketName(bucketName);

  const params = _bucketRequestParams('GET', bucketName, subres, options);
  params.successStatuses = [200];

  params.xmlResponse = true;
  const result = await this.request(params);
  const { data, res, status } = result;
  return {
    isTruncated: data.IsTruncated === 'true',
    nextContinuationToken: data.NextContinuationToken,
    inventoryList: formatInventoryConfig(data.InventoryConfiguration, true),
    status,
    res,
  };
}
