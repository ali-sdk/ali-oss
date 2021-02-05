import { RequestOptions } from '../../types/params';
import { InitiateBucketWormReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function initiateBucketWorm(this: Client, name: string, days: string | number, options?: RequestOptions): Promise<InitiateBucketWormReturnType>;
