import { RequestOptions } from '../../types/params';
import { GetBucketLocationReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function getBucketLocation(this: Client, name: string, options?: RequestOptions): Promise<GetBucketLocationReturnType>;
