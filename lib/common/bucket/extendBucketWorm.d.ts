import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function extendBucketWorm(this: Client, name: string, wormId: string, days: string | number, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
