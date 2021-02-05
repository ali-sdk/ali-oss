import { Client } from '../../setConfig';
import { PutBucketOptionsType, PutBucketReturnType } from '../../types/bucket';
export declare function putBucket(this: Client, name: string, options?: PutBucketOptionsType): Promise<PutBucketReturnType>;
