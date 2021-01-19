import { PutBucketInventoryConfig } from '../../types/bucket';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
/**
 * putBucketInventory
 */
export declare function putBucketInventory(this: any, bucketName: string, inventory: PutBucketInventoryConfig, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
