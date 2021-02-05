import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function completeBucketWorm(this: Client, name: string, wormId: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
