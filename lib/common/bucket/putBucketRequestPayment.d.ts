import { BucketRequestPayer, NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function putBucketRequestPayment(this: Client, bucketName: string, payer: BucketRequestPayer, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
