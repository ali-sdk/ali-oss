interface bucketStatRes {
    Storage: string;
    ObjectCount: string;
    MultipartUploadCount: string;
    LiveChannelCount: string;
    LastModifiedTime: string;
    StandardStorage: string;
    StandardObjectCount: string;
    InfrequentAccessStorage: string;
    InfrequentAccessRealStorage: string;
    InfrequentAccessObjectCount: string;
    ArchiveStorage: string;
    ArchiveRealStorage: string;
    ArchiveObjectCount: string;
    ColdArchiveStorage: string;
    ColdArchiveRealStorage: string;
    ColdArchiveObjectCount: string;
}
export declare function getBucketStat(this: any, name: string, options: {}): Promise<{
    res: any;
    stat: bucketStatRes;
}>;
export {};
