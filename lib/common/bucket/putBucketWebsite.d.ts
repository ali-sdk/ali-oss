import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { PutBucketWebsiteConfigType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function putBucketWebsite(this: Client, name: string, config?: PutBucketWebsiteConfigType, options?: RequestOptions): Promise<NormalSuccessResponse>;
