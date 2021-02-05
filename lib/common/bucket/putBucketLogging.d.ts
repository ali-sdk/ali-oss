import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function putBucketLogging(this: Client, name: string, prefix?: string, options?: RequestOptions): Promise<NormalSuccessResponse>;
