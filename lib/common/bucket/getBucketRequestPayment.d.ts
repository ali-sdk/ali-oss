import { RequestOptions } from '../../types/params';
import { GetBucketRequestPaymentReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function getBucketRequestPayment(this: Client, bucketName: string, options?: RequestOptions): Promise<GetBucketRequestPaymentReturnType>;
