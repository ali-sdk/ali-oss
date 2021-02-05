import { RequestOptions, NormalSuccessResponse } from '../../types/params';
import { BucketCORSRule } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function putBucketCORS(this: Client, name: string, rules?: BucketCORSRule[], options?: RequestOptions): Promise<NormalSuccessResponse>;
