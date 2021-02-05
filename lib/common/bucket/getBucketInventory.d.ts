import { Client } from '../../setConfig';
import { GetBucketInventoryReturnType } from '../../types/bucket';
/**
 * getBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
export declare function getBucketInventory(this: Client, bucketName: string, inventoryId: string, options?: any): Promise<GetBucketInventoryReturnType>;
