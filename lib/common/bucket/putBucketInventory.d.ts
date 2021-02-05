import { Client } from '../../setConfig';
import { PutBucketInventoryConfig } from '../../types/bucket';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
/**
 * putBucketInventory
 */
export declare function putBucketInventory(this: Client, bucketName: string, inventory: PutBucketInventoryConfig, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
