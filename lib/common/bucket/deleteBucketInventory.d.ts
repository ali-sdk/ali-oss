import { Client } from '../../setConfig';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
/**
 * deleteBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
export declare function deleteBucketInventory(this: Client, bucketName: string, inventoryId: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
