import { RequestOptions } from '../../types/params';
/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function deleteBucketPolicy(this: any, bucketName: string, options?: RequestOptions): Promise<{
    status: any;
    res: any;
}>;
