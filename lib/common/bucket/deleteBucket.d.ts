import { RequestOptions } from '../../types/params';
import { DeleteBucketReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function deleteBucket(this: Client, name: string, options?: RequestOptions): Promise<DeleteBucketReturnType>;
