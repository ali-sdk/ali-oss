import { RequestOptions } from '../../types/params';
/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketRequestPayment(this: any, bucketName: string, options?: RequestOptions): Promise<{
    status: any;
    res: any;
    payer: any;
}>;
