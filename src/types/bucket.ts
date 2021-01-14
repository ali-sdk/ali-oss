import { StorageType, ACLType, RequestOptions, NormalSuccessResponse, DataRedundancyType, Versioning, SSEAlgorithm } from './params';

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