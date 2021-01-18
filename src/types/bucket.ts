import { StorageType, ACLType, RequestOptions, NormalSuccessResponse, DataRedundancyType, Versioning, SSEAlgorithm, Container, Protocol, BucketRequestPayer } from './params';

export interface ListBucketsQueryType {
  /** search buckets using prefix key */
  prefix?: string;
  /**  search start from marker, including marker key */
  marker?: string;
  /** max buckets, default is 100, limit to 1000 */
  'max-keys'?: string | number;
  /** the operation timeout */
  timeout?: number;
  subres?: object;
}

export interface ListBucketsReturnType extends NormalSuccessResponse {
  /** bucket meta info list */
  buckets: Array<{
    /** bucket name */
    name: string;
    /** bucket store data region */
    region: string;
    /** bucket create GMT date */
    creationDate: string;
    /** bucket storage type */
    storageClass: StorageType;
    /** compatibility, It's always equal to `storageClass`  */
    StorageClass: StorageType;
    /** compatibility. It's always an empty object */
    tag: {};
  }> | null,
  /** object owner */
  owner: {
    id: string;
    displayName: string;
  },
  /** truncate or not */
  isTruncated: boolean;
  /** next marker string */
  nextMarker: string | null;
}

export interface PutBucketOptionsType extends RequestOptions {
  /** the storage type */
  storageClass?: StorageType;
  /** default LRS */
  dataRedundancyType?: DataRedundancyType;
  StorageClass?: StorageType;
  DataRedundancyType?: DataRedundancyType;
  /** Bucket的ACL权限 */
  acl?: ACLType;
}

export interface PutBucketReturnType extends NormalSuccessResponse {
  bucket: string;
}

export type DeleteBucketReturnType = NormalSuccessResponse;

export interface GetBucketInfoReturnType extends NormalSuccessResponse {
  bucket: {
    /** Bucket的创建时间 */
    CreationDate: string;
    /** Bucket的外网域名 */
    ExtranetEndpoint: string;
    /** 同地域ECS访问Bucket的内网域名 */
    IntranetEndpoint: string;
    /** Bucket所在的地域 */
    Location: string;
    /** Bucket名称 */
    Name: string;
    /** 存放Bucket拥有者信息的容器 */
    Owner: {
      /** Bucket拥有者的用户ID */
      ID: string
      /** Bucket拥有者的名称（目前和用户ID一致） */
      DisplayName: string;
    };
    /** Bucket的版本控制状态 */
    Versioning?: Versioning;
    /** Bucket读写权限（ACL）信息的容器 */
    AccessControlList: {
      /** Bucket的ACL权限 */
      Grant: ACLType
    };
    /** Bucket的数据容灾类型 */
    DataRedundancyType: DataRedundancyType;
    /** Bucket的存储类型 */
    StorageClass: StorageType;
    /** 服务器端加密方式的容器 */
    ServerSideEncryptionRule: {
      /** 显示服务器端默认加密方式 */
      SSEAlgorithm: SSEAlgorithm | 'None';
      /** 显示当前使用的KMS密钥ID。仅当SSEAlgorithm为KMS，且指定了密钥ID时返回取值。 */
      KMSMasterKeyID?: string;
    };
    BucketPolicy?: { LogBucket: ''; LogPrefix: '' }
    Comment?: '';
  }
}

export interface GetBucketLocationReturnType extends NormalSuccessResponse {
  location: string;
}

export interface PutBucketACLReturnType extends NormalSuccessResponse {
  bucket: string;
}

export interface GetBucketACLReturnType extends NormalSuccessResponse {
  acl: ACLType;
  owner: {
    id: string;
    displayName: string;
  },
}

export interface GetBucketLoggingReturnType extends NormalSuccessResponse {
  enable: boolean;
  prefix: string | null;
}

interface RoutingRule {
  /** 匹配和执行RoutingRule的序号，OSS将按照此序号依次匹配规则。如果匹配成功，则执行此规则，后续的规则不再执行。 */
  RuleNumber: number;
  /** 如果指定的项都满足，则执行此规则。满足此容器下的各个节点的所有条件才算匹配。 */
  Condition: {
    KeyPrefixEquals?: string;
    HttpErrorCodeReturnedEquals?: string;
    IncludeHeader?: {
      Key: string;
      Equals: string;
    };
    KeySuffixEquals?: string;
  };
  Redirect: {
    RedirectType: 'Mirror' | 'External' | 'AliCDN';
    PassQueryString?: boolean;
    MirrorURL?: string;
    MirrorPassQueryString?: boolean;
    MirrorFollowRedirect?: boolean;
    MirrorCheckMd5?: boolean;
    MirrorHeaders?: Container<{
      PassAll: boolean;
      Pass: string;
      Remove: string;
      Set: Container<{
        Key: string;
        Value: string;
      }>;
    }>;
    /** required when RedirectType is External or AliCDN */
    Protocol?: Protocol;
    /** required when RedirectType is External or AliCDN */
    HostName?: string;
    /** required when RedirectType is External or AliCDN */
    HttpRedirectCode?: 301 | 302 | 307;
    ReplaceKeyPrefixWith?: string;
    EnableReplacePrefix?: boolean;
    ReplaceKeyWith?: string;
  };
}
export interface PutBucketWebsiteConfigType {
  /** default page, e.g.: 'index.html' */
  index: string;
  /** error page, e.g.: 'error.html' */
  error?: string;
  /** 否支持访问子目录时转至子目录下的默认主页, default 'false' */
  supportSubDir?: boolean;
  /**
   * 设置了默认主页后，访问以非正斜线（/）结尾的Object，且该Object不存在时的行为
   * 只有在SupportSubDir为true时生效\
   * 假设默认主页设置为index.html，访问的文件路径是bucket.oss-cn-hangzhou.aliyuncs.com/abc，且abc这个Object不存在\
   * 0 (default): 检查abc/index.html是否存在, 如果存在则返回302，Location头为/abc/的URL编码，如果不存在则返回404，继续检查ErrorFile。\
   * 1: 直接返回404，报错NoSuchKey，继续检查ErrorFile\
   * 2: 检查abc/index.html是否存在，如果存在则返回该Object的内容；如果不存在则返回404，继续检查ErrorFile。\
   */
  type?: 0 | 1 | 2;
  /**  */
  routingRules?: {
    RoutingRule: Container<RoutingRule>
  };
}

export interface GetBucketWebsiteReturnType extends NormalSuccessResponse {
  index: string;
  supportSubDir: 'true' | 'false';
  type: '0' | '1' | '2';
  routingRules: RoutingRule[];
  error: string | null;
}

export interface GetBucketRefererReturnType extends NormalSuccessResponse {
  allowEmpty: boolean;
  referers: string[];
}

export interface BucketCORSRule {
  allowedOrigin: string | string[];
  allowedMethod: string | string[];
  allowedHeader?: string | string[];
  exposeHeader?: string | string[];
  maxAgeSeconds?: string | string[];
}

export interface GetBucketCORSReturnType extends NormalSuccessResponse {
  rules: BucketCORSRule[];
}

export interface PutBucketRequestPaymentReturnType extends NormalSuccessResponse {
  status: number;
}

export interface GetBucketRequestPaymentReturnType extends NormalSuccessResponse {
  status: number;
  payer: BucketRequestPayer;
}


type BucketEncryptionRule = {
  SSEAlgorithm: 'KMS';
  KMSDataEncryption?: 'SM4';
  KMSMasterKeyID?: string;
} | {
  SSEAlgorithm: 'AES256'
} | {
  SSEAlgorithm: 'SM4'
};

export type PutBucketEncryptionOptions = BucketEncryptionRule & RequestOptions;

export interface PutBucketEncryptionReturnType extends NormalSuccessResponse {
  status: number;
}

export interface GetBucketEncryptionReturnType extends NormalSuccessResponse {
  status: number;
  encryption: BucketEncryptionRule;
}
