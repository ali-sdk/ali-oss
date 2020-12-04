import { checkBucketName } from '../utils/checkBucketName';
import { formatInventoryConfig } from '../utils/formatInventoryConfig';
/**
 * getBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */

export async function getBucketInventory(this: any, bucketName: string, inventoryId: string, options: any = {}) {
  const subres: any = Object.assign({ inventory: '', inventoryId }, options.subres);
  checkBucketName(bucketName);

  const params = this._bucketRequestParams('GET', bucketName, subres, options);
  params.successStatuses = [200];

  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
    inventory: formatInventoryConfig(result.data)
  };
}
