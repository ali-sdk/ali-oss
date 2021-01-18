import { PutBucketEncryptionOptions, PutBucketEncryptionReturnType } from '../../types/bucket';
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function putBucketEncryption(this: any, bucketName: string, options: PutBucketEncryptionOptions): Promise<PutBucketEncryptionReturnType>;
