import { PutBucketEncryptionOptions } from '../../types/params';
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function putBucketEncryption(this: any, bucketName: string, options: PutBucketEncryptionOptions): Promise<{
    status: any;
    res: any;
}>;
