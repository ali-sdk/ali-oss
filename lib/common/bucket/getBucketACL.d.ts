import { RequestOptions } from '../../types/params';
import { GetBucketACLReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketACL(this: Client, name: string, options?: RequestOptions): Promise<GetBucketACLReturnType>;
