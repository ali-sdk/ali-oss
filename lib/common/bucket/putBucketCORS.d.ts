import { RequestOptions, NormalSuccessResponse } from '../../types/params';
import { BucketCORSRule } from '../../types/bucket';
export declare function putBucketCORS(this: any, name: string, rules?: BucketCORSRule[], options?: RequestOptions): Promise<NormalSuccessResponse>;
