import { RequestOptions } from '../../types/params';
import { ListBucketsQueryType, ListBucketsReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function listBuckets(this: Client, query?: ListBucketsQueryType, options?: RequestOptions): Promise<ListBucketsReturnType>;
