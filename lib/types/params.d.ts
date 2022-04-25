export declare type ACLType = 'public-read-write' | 'public-read' | 'private';
export declare type SSEAlgorithm = 'KMS' | 'AES256';
export declare type RuleStatusType = 'Enabled' | 'Disabled';
export declare type StorageType = 'Standard' | 'IA' | 'Archive';
export declare type Protocol = 'http' | 'https';
export declare type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD';
export interface Subres {
    [propsName: string]: string | undefined;
    versionId?: string;
}
export interface DoneParts {
    number: number;
    etag: string;
}
export interface Tag {
    [propsName: string]: string;
}
export interface RequestOptions {
    timeout?: number;
    headers?: object;
    subres?: Subres;
    ctx?: string;
    disabledMD5?: boolean;
}
interface UserMeta {
    [propsName: string]: string;
}
export interface Checkpoint {
    file: any;
    name: string;
    fileSize: number;
    partSize: number;
    uploadId: string;
    doneParts: DoneParts[];
}
interface ObjectCallback {
    url: string;
    host?: string;
    body: string;
    contentType?: string;
    customValue?: object;
    headers?: object;
}
export interface MultipartUploadOptions extends RequestOptions {
    parallel?: number;
    partSize?: number;
    progress?: (...args: any[]) => any;
    checkpoint?: Checkpoint;
    meta?: UserMeta;
    mime?: string;
    callback?: ObjectCallback;
    copyheaders?: object;
    contentLength?: number;
}
export interface GetObjectOptions extends MultiVersionCommonOptions {
    process?: string;
    /** only support Browser.js */
    responseCacheControl?: string;
}
export interface PutObjectOptions extends RequestOptions {
    mime?: string;
    meta?: UserMeta;
    callback?: ObjectCallback;
    contentLength?: number;
    method?: string;
    disabledMD5?: boolean;
}
export interface PutBucketOptions extends RequestOptions {
    storageClass?: StorageType;
    StorageClass?: StorageType;
    DataRedundancyType?: string;
    dataRedundancyType?: string;
    acl?: ACLType;
}
export interface CORSRuleConfig {
    allowedOrigin: string | string[];
    allowedMethod: string | string[];
    allowedHeader?: string | string[];
    exposeHeader?: string | string[];
    maxAgeSeconds?: string | string[];
}
export interface PutBucketEncryptionOptions extends RequestOptions {
    SSEAlgorithm: SSEAlgorithm;
    KMSMasterKeyID?: string;
}
interface LifecycleDate {
    days?: number | string;
    createdBeforeDate?: string;
}
interface LifecycleTransition extends LifecycleDate {
    storageClass: 'IA' | 'Archive';
}
interface LifecycleExpiration extends LifecycleDate {
    expiredObjectDeleteMarker?: boolean;
}
interface LifecycleNoncurrentVersionTransition {
    noncurrentDays: string | number;
    storageClass: 'IA' | 'Archive';
}
export interface LifecycleRule extends LifecycleDate {
    id?: string;
    prefix: string;
    status: RuleStatusType;
    date?: string;
    tag?: Tag | Tag[];
    abortMultipartUpload?: LifecycleDate;
    transition?: LifecycleTransition;
    expiration?: LifecycleExpiration;
    noncurrentVersionTransition?: LifecycleNoncurrentVersionTransition;
    noncurrentVersionExpiration?: {
        noncurrentDays: number | string;
    };
}
interface RoutingRule {
    RuleNumber: number;
    Condition: {
        KeyPrefixEquals?: string;
        HttpErrorCodeReturnedEquals?: string | number;
        IncludeHeader?: {
            Key: string;
            Equals: string;
        };
        KeySuffixEquals?: string;
    };
    Redirect: {
        RedirectType: 'Mirror' | 'External' | 'Internal' | 'AliCDN';
        PassQueryString?: number;
        MirrorURL?: string;
        MirrorPassQueryString?: boolean;
        MirrorFollowRedirect?: boolean;
        MirrorCheckMd5?: boolean;
        MirrorHeaders?: {
            PassAll?: string;
            Remove?: string;
            Set?: {
                Key: string;
                Value: string;
            };
        };
        Protocol?: Protocol;
        HostName?: string;
        HttpRedirectCode?: 301 | 302 | 307;
        ReplaceKeyPrefixWith?: string;
        ReplaceKeyWith?: string;
        EnableReplacePrefix: boolean;
    };
}
export interface PutBucketWebsiteConfig {
    index: string;
    supportSubDir?: boolean;
    error?: string;
    type?: 0 | '0' | 1 | '1' | 2 | '2';
    routingRules?: RoutingRule;
}
export interface CompleteMultipartUploadOptions extends RequestOptions {
    callback?: ObjectCallback;
}
export interface InitMultipartUploadOptions extends RequestOptions {
    mime?: string;
    meta?: UserMeta;
}
export interface ListUploadsQuery {
    delimiter?: string;
    'max-uploads'?: string;
    'key-marker'?: string;
    prefix?: string;
    'upload-id-marker'?: string;
    'encoding-type'?: string;
}
export interface MultipartUploadCopySourceData {
    sourceKey: string;
    sourceBucketName: string;
    startOffset?: number;
    endOffset?: number;
}
export interface AppendObjectOptions extends RequestOptions {
    position?: string;
    mime?: string;
    meta?: UserMeta;
    method?: 'POST' | 'PUT';
    put?: Function;
}
export interface MultiVersionCommonOptions extends RequestOptions {
    versionId?: string;
    type?: string;
    Days?: number;
    JobParameters?: string;
}
export declare type DeleteMultiNameObj = {
    key: string;
    versionId?: string;
};
export declare type DeleteMultiName = string | DeleteMultiNameObj;
export interface getBucketVersionsQuery {
    prefix?: string;
    keyMarker?: string;
    versionIdMarker?: string;
    delimiter?: string;
    maxKeys?: string;
}
export interface listQuery {
    prefix?: string;
    marker?: string;
    delimiter?: string;
    'max-keys'?: string | number;
    'encoding-type'?: 'url';
}
export interface listV2Query {
    prefix?: string;
    delimiter?: string;
    'start-after'?: string;
    'continuation-token'?: string;
    'max-keys'?: string;
    'encoding-type'?: 'url';
    'fetch-owner'?: boolean;
}
export interface postAsyncFetchOptions extends RequestOptions {
    host?: string;
    contentMD5?: string;
    callback?: string;
    storageClass?: StorageType;
    ignoreSameKey?: boolean;
}
export interface putSymlinkOptions extends MultiVersionCommonOptions {
    meta?: UserMeta;
    storageClass?: StorageType;
}
export interface signatureUrlOptions extends RequestOptions {
    expires?: number;
    method?: HttpMethod;
}
/** multiple upload object start */
/** multiple upload object option */
export declare type MultipleObjectUploadOptions = {
    splitSize?: number;
    syncNumber?: number;
    taskOver?: (objects: TMUploadObject[]) => void;
};
/** multiple upload object result */
export declare type MultipleObjectUploadResult = {
    add: (objects: TMUploadStartPara[]) => boolean;
    suspend: (obj: string) => boolean;
    reStart: (obj: string) => boolean;
    delete: (obj: string) => boolean;
    dispose: () => boolean;
    getFails: () => TMUploadObject[];
};
export declare type MultipleObjectDownloadResult = {
    add: (objects: TMDownloadStartPara[]) => Promise<boolean>;
    suspend: (obj: string) => boolean;
    reStart: (obj: string) => boolean;
    delete: (obj: string) => boolean;
    dispose: () => void;
};
export declare type MultipleObjectDeleteResult = {
    add: (objects: TMDeleteStartPara[]) => boolean;
    suspend: (obj: string) => boolean;
    reStart: (obj: string) => boolean;
    delete: (obj: string) => boolean;
    dispose: () => void;
};
/** task status */
export declare enum ETaskStatus {
    wait = 0,
    suspend = 1,
    doing = 2,
    fail = 3,
    success = 4
}
/** multiple upload object config */
export declare type TMUploadConfig = {
    bucketName: string;
    region: string;
    folder: string;
};
/** multiple upload object type */
export declare enum EMUploadType {
    small = 0,
    big = 1
}
/** multiple upload object */
export declare type TMUploadObject = {
    type: EMUploadType;
    name: string;
    file: string;
    size: number;
    status: ETaskStatus;
    progress: number;
    checkpoint?: any;
    getProgress: (res: number, checkpoint?: any) => void;
    message?: string;
};
/** multiple upload object start parameter */
export declare type TMUploadStartPara = {
    name: string;
    file: string;
    size: number;
    checkpoint?: any;
    getProgress?: (res: number, checkpoint?: any) => void;
};
/** multiple download object option */
export declare type MultipleObjectDownloadOptions = {
    path?: string;
    splitSize?: number;
    syncNumber?: number;
    progress?: (res: number) => void;
};
/** multiple download object */
/** multiple upload object start parameter */
export declare type TMDownloadStartPara = {
    name: string;
    size?: number;
    checkpoint?: any;
    getProgress: (res: number, checkpoint?: any) => void;
};
export declare type TMDownloadObject = {
    type: EMUploadType;
    name: string;
    size: number;
    status: ETaskStatus;
    progress: number;
    checkpoint?: any;
    getProgress: (res: number, checkpoint?: any) => void;
    error?: string;
};
/** multiple delete object start parameter */
export declare type TMDeleteStartPara = {
    prefix: string;
    getProgress: (res: number, checkpoint?: any) => void;
};
/** multiple delete object option */
export declare type MultipleObjectDeleteOptions = {
    syncNumber?: number;
    pageSize?: number;
};
/** multiple delete object */
export declare type TMDeleteObject = {
    prefix: string;
    status: ETaskStatus;
    progress: number;
    getProgress: (res: number) => void;
    message?: string;
};
export {};
