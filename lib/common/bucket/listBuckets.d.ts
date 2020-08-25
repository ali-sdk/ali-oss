import { RequestOptions } from '../../types/params';
export declare function listBuckets(this: any, query?: any, options?: RequestOptions): Promise<{
    buckets: any;
    owner: {
        id: any;
        displayName: any;
    };
    isTruncated: boolean;
    nextMarker: any;
    res: any;
}>;
