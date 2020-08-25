import { getBucketVersionsQuery, MultiVersionCommonOptions } from '../../types/params';
export declare function getBucketVersions(this: any, query?: getBucketVersionsQuery, options?: MultiVersionCommonOptions): Promise<{
    res: any;
    objects: any;
    deleteMarker: any;
    prefixes: any;
    nextMarker: any;
    NextVersionIdMarker: any;
    isTruncated: boolean;
}>;
