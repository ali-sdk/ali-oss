import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function putBucketReferer(this: Client, name: string, allowEmpty: boolean, referers: string[] | null, options?: RequestOptions): Promise<NormalSuccessResponse>;
