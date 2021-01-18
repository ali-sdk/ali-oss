import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { PutBucketPolicyConfig } from "../../types/bucket_policy";
/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */
export declare function putBucketPolicy(this: any, bucketName: string, policy: PutBucketPolicyConfig, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
