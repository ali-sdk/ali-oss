import { RequestOptions } from '../../types/params';
import { ListBucketsQueryType, ListBucketsReturnType } from '../../types/bucket';
export declare function listBuckets(this: any, query?: ListBucketsQueryType, options?: RequestOptions): Promise<ListBucketsReturnType>;
