import { RequestOptions } from '../../types/params';
import { GetBucketVersionsQueryParams, getBucketVersionsReturnType } from '../../types/object';
import { Client } from '../../setConfig';
export declare function getBucketVersions(this: Client, query?: GetBucketVersionsQueryParams, options?: RequestOptions): Promise<getBucketVersionsReturnType>;
