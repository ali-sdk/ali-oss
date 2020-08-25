import { RequestOptions } from '../../types/params';
/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */
export declare function putBucketPolicy(this: any, bucketName: string, policy: object, options?: RequestOptions): Promise<{
    status: any;
    res: any;
}>;
