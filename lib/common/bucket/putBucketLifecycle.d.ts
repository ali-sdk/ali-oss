import { RequestOptions, LifecycleRule } from '../../types/params';
export declare function putBucketLifecycle(this: any, name: string, rules: LifecycleRule[], options?: RequestOptions): Promise<{
    res: any;
}>;
