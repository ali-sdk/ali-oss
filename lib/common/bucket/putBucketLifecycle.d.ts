import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { LifecycleRule } from '../../types/bucket_lifecycle';
import { Client } from '../../setConfig';
export declare function putBucketLifecycle(this: Client, name: string, rules: LifecycleRule[], options?: RequestOptions): Promise<NormalSuccessResponse>;
