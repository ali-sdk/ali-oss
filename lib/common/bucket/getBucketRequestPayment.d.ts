import { RequestOptions } from '../../types/params';
import { GetBucketRequestPaymentReturnType } from '../../types/bucket';
/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketRequestPayment(this: any, bucketName: string, options?: RequestOptions): Promise<GetBucketRequestPaymentReturnType>;
