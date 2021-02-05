import { RequestOptions } from '../../types/params';
import { GetBucketWormReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketWorm(this: Client, name: string, options?: RequestOptions): Promise<GetBucketWormReturnType>;
