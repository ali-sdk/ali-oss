import { listV2Query } from '../../types/params';
export declare function listV2(this: any, query: listV2Query, options?: {
    subres?: any;
}): Promise<{
    res: any;
    objects: any;
    prefixes: any;
    isTruncated: boolean;
    keyCount: number;
    continuationToken: any;
    nextContinuationToken: any;
}>;
