import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { LifecycleRule } from '../../types/bucket_lifecycle';
export declare function putBucketLifecycle(this: any, name: string, rules: LifecycleRule[], options?: RequestOptions): Promise<NormalSuccessResponse>;
