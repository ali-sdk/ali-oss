import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function abortBucketWorm(this: Client, name: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
