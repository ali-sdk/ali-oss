import { RequestOptions } from '../../types/params';
import { GetBucketEncryptionReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */
export declare function getBucketEncryption(this: Client, bucketName: string, options?: RequestOptions): Promise<GetBucketEncryptionReturnType>;
