import { RequestOptions } from '../../types/params';
import { GetBucketCORSReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketCORS(this: Client, name: string, options?: RequestOptions): Promise<GetBucketCORSReturnType>;
