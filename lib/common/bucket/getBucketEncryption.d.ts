import { RequestOptions } from '../../types/params';
import { GetBucketEncryptionReturnType } from '../../types/bucket';
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */
export declare function getBucketEncryption(this: any, bucketName: string, options?: RequestOptions): Promise<GetBucketEncryptionReturnType>;
