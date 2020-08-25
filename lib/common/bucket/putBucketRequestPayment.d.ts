import { RequestOptions } from '../../types/params';
export declare function putBucketRequestPayment(this: any, bucketName: string, payer: 'BucketOwner' | 'Requester', options?: RequestOptions): Promise<{
    status: any;
    res: any;
}>;
