import { RequestOptions } from '../../types/params';
import { GetBucketPolicyReturnType } from '../../types/bucket_policy';
/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketPolicy(this: any, bucketName: string, options?: RequestOptions): Promise<GetBucketPolicyReturnType>;
