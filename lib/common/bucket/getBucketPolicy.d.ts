import { RequestOptions } from '../../types/params';
import { GetBucketPolicyReturnType } from '../../types/bucket_policy';
import { Client } from '../../setConfig';
/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketPolicy(this: Client, bucketName: string, options?: RequestOptions): Promise<GetBucketPolicyReturnType>;
