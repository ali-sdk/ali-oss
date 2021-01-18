import { RequestOptions } from '../../types/params';
import { PutBucketEncryptionReturnType } from '../../types/bucket';
/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */
export declare function deleteBucketEncryption(this: any, bucketName: string, options?: RequestOptions): Promise<PutBucketEncryptionReturnType>;
