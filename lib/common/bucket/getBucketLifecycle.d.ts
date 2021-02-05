import { RequestOptions } from '../../types/params';
import { GetBucketLifecycleReturnType } from '../../types/bucket_lifecycle';
import { Client } from '../../setConfig';
export declare function getBucketLifecycle(this: Client, name: string, options?: RequestOptions): Promise<GetBucketLifecycleReturnType>;
