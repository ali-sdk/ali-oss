import { listQuery } from '../../types/params';
export declare function list(this: any, query?: listQuery, options?: any): Promise<{
    res: any;
    objects: any;
    prefixes: any;
    nextMarker: any;
    isTruncated: boolean;
}>;
