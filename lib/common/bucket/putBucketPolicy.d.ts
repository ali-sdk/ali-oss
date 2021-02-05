import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { PutBucketPolicyConfig } from "../../types/bucket_policy";
import { Client } from '../../setConfig';
/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */
export declare function putBucketPolicy(this: Client, bucketName: string, policy: PutBucketPolicyConfig, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
