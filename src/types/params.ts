/* eslint-disable max-len */

export type ACLType = 'public-read-write' | 'public-read' | 'private';

export type SSEAlgorithm = 'KMS' | 'AES256';

export type RuleStatusType = 'Enabled' | 'Disabled';

export type StorageType = 'Standard' | 'IA' | 'Archive';

export type Protocol = 'http' | 'https';

export type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD';

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
  crc64?: boolean | Function;
}

interface UserMeta {
  [propsName: string]: string;
}

export interface Checkpoint {
  file: any; // The file object selected by the user, if the browser is restarted, it needs the user to manually trigger the settings
  name: string; //  object key
  fileSize: number;
  partSize: number;
  uploadId: string;
  doneParts: DoneParts[];
}

interface ObjectCallback {
  url: string; // After a file is uploaded successfully, the OSS sends a callback request to this URL.
  host?: string; // The host header value for initiating callback requests.
  body: string; // The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var).
  contentType?: string; // The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value.
  customValue?: object;
  headers?: object; //  extra headers, detail see RFC 2616
}

export interface MultipartUploadOptions extends RequestOptions {
  parallel?: number; // the number of parts to be uploaded in parallel
  partSize?: number; // the suggested size for each part
  progress?: (...args: any[]) => any; // the progress callback called after each successful upload of one part
  checkpoint?: Checkpoint; // the checkpoint to resume upload, if this is provided, it will continue the upload from where interrupted, otherwise a new multipart upload will be created.
  meta?: UserMeta;
  mime?: string;
  callback?: ObjectCallback;
  copyheaders?: object; //  {Object} only uploadPartCopy api used, detail
  contentLength?: number;
  crc64?: boolean | Function;
}

export interface GetObjectOptions extends MultiVersionCommonOptions {
  process?: string; // image process params, will send with x-oss-process e.g.: {process: 'image/resize,w_200'}
  /** only support Browser.js */
  responseCacheControl?: string;
  crc64?: boolean | Function;
}

export interface PutObjectOptions extends RequestOptions {
  mime?: string; // custom mime, will send with Content-Type entity header
  meta?: UserMeta; // user meta, will send with x-oss-meta- prefix string e.g.: { uid: 123, pid: 110 }
  callback?: ObjectCallback;
  contentLength?: number;
  method?: string; // append object need
  disabledMD5?: boolean;
  crc64?: boolean | Function;
}

export interface PutBucketOptions extends RequestOptions {
  storageClass?: StorageType;
  StorageClass?: StorageType;
  DataRedundancyType?: string;
  dataRedundancyType?: string;
  acl?: ACLType;
}

export interface CORSRuleConfig {
  allowedOrigin: string | string[]; // configure for Access-Control-Allow-Origin header
  allowedMethod: string | string[]; // configure for Access-Control-Allow-Methods header
  allowedHeader?: string | string[]; // configure for Access-Control-Allow-Headers header
  exposeHeader?: string | string[]; // configure for Access-Control-Expose-Headers header
  maxAgeSeconds?: string | string[]; // configure for Access-Control-Max-Age header
}

export interface PutBucketEncryptionOptions extends RequestOptions {
  SSEAlgorithm: SSEAlgorithm;
  KMSMasterKeyID?: string;
}

interface LifecycleDate {
  days?: number | string; // expire after the days
  createdBeforeDate?: string; //  expire date, equivalent date. e.g: 2020-02-18T00:00:00.000Z
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
  id?: string; // rule id, if not set, OSS will auto create it with random string.
  prefix: string; // store prefix
  status: RuleStatusType; // rule status, allow values: Enabled or Disabled
  date?: string; // expire date, e.g.: 2022-10-11T00:00:00.000Z date and days only set one.
  tag?: Tag | Tag[]; // filter object
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
    Protocol?: Protocol; // need when RedirectType is External or AliCDN
    HostName?: string; // need when RedirectType is External or AliCDN
    HttpRedirectCode?: 301 | 302 | 307; // need when RedirectType is External or AliCDN
    ReplaceKeyPrefixWith?: string;
    ReplaceKeyWith?: string;
    EnableReplacePrefix: boolean;
  };
}

export interface PutBucketWebsiteConfig {
  index: string; // default page, e.g.: index.html
  supportSubDir?: boolean; // default false;
  error?: string; // error page, e.g.: 'error.html'
  type?: 0 | '0' | 1 | '1' | 2 | '2';
  routingRules?: RoutingRule;
}

export interface CompleteMultipartUploadOptions extends RequestOptions {
  callback?: ObjectCallback;
}

export interface InitMultipartUploadOptions extends RequestOptions {
  mime?: string; // Mime file type
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
  position?: string; // specify the position which is the content length of the latest object
  mime?: string; // custom mime, will send with Content-Type entity header
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

export type DeleteMultiNameObj = { key: string; versionId?: string };
export type DeleteMultiName = string | DeleteMultiNameObj;

export interface getBucketVersionsQuery {
  // Prefix、Key-marker、Version-id-marker、Delimiter和Max-keys
  prefix?: string;
  keyMarker?: string;
  versionIdMarker?: string;
  delimiter?: string;
  maxKeys?: string;
}

export interface listQuery {
  prefix?: string; // search object using prefix key
  marker?: string; // search start from marker, including marker key
  delimiter?: string; // delimiter search scope e.g. / only search current dir, not including subdir
  'max-keys'?: string | number; // max objects, default is 100, limit to 1000
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
