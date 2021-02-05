import { RequestOptions } from '../../types/params';
import { GetBucketInfoReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketInfo(this: Client, name: string, options?: RequestOptions): Promise<GetBucketInfoReturnType>;
