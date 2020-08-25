import { RequestOptions } from '../../types/params';
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */
export declare function getBucketEncryption(this: any, bucketName: string, options?: RequestOptions): Promise<{
    encryption: any;
    status: any;
    res: any;
}>;
