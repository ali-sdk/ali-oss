import { PutBucketEncryptionOptions } from '../../types/bucket';
import { NormalSuccessResponseWithStatus } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function putBucketEncryption(this: Client, bucketName: string, options: PutBucketEncryptionOptions): Promise<NormalSuccessResponseWithStatus>;
