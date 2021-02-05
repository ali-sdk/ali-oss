import { Client } from '../../setConfig';
import { ListBucketInventoryReturnType } from '../../types/bucket';
/**
 * listBucketInventory
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function listBucketInventory(this: Client, bucketName: string, options?: any): Promise<ListBucketInventoryReturnType>;
