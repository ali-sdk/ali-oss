import { RequestOptions } from '../../types/params';
import { GetBucketLoggingReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketLogging(this: Client, name: string, options?: RequestOptions): Promise<GetBucketLoggingReturnType>;
