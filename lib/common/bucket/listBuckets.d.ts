export declare function listBuckets(this: any, query?: any, options?: any): Promise<{
    buckets: any;
    owner: {
        id: any;
        displayName: any;
    };
    isTruncated: boolean;
    nextMarker: any;
    res: any;
}>;
