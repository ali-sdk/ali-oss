import { RequestOptions } from '../../types/params';
/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketPolicy(this: any, bucketName: string, options?: RequestOptions): Promise<{
    policy: null;
    status: any;
    res: any;
}>;
