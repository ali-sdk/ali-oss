import { BucketRequestPayer, RequestOptions } from '../../types/params';
import { PutBucketRequestPaymentReturnType } from '../../types/bucket';
export declare function putBucketRequestPayment(this: any, bucketName: string, payer: BucketRequestPayer, options?: RequestOptions): Promise<PutBucketRequestPaymentReturnType>;
