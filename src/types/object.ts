import { Writable } from 'stream';
import { NormalSuccessResponse, ObjectType, RequestOptions, StorageType, UserMeta, MultiVersionCommonOptions, ObjectCallback } from './params';

interface IObjectInfo {
  name: string,
  url: string,
  lastModified: string,
  etag: string,
  type: ObjectType,
  size: number,
  storageClass: StorageType,
  owner: {
    id: string,
    displayName: string,
  },
}
export interface ObjectListQueryParams {
  /** search object using prefix key */
  prefix?: string;
  /** search start from marker, including marker key */
  marker?: string;
  /** delimiter search scope e.g. `/` only search current dir, not including subdir */
  delimiter?: string;
  /** max objects, default is 100, limit to 1000 */
  'max-keys'?: string | number;
  'encoding-type'?: 'url';
}
export interface ObjectListReturnType extends NormalSuccessResponse {
  objects: IObjectInfo[] | undefined,
  /** If the delimiter parameter is specified in the request, the response contains the prefixes element.  */
  prefixes: string[] | null,
  nextMarker: string | null,
  isTruncated: boolean,
}

export interface ObjectListV2QueryParams {
  /** The prefix that the returned object names must contain. */
  prefix?: string,
  /** The character used to group objects by name. If you specify the `delimiter` parameter in the request, the response contains the prefixes element.  */
  delimiter?: string,
  /** Specifies the Start-after value from which to start the list. */
  'start-after'?: string,
  /** The token from which the List operation must start. */
  'continuation-token'?: string,
  /** The maximum number of objects to return. Default value: 100, max value: 1000. */
  'max-keys'?: string,
  /** The encoding type of the object name in the response. */
  'encoding-type'?: 'url',
  /** Specifies whether to include the owner information in the response. */
  'fetch-owner'?: boolean,
}

export interface ObjectListV2ReturnType extends NormalSuccessResponse {
  objects: Array<
    Omit<IObjectInfo, 'owner'> & {
      owner: {
        id: string,
        displayName: string,
      } | null,
    }> | undefined;
  prefixes: string[] | null;
  isTruncated: boolean;
  keyCount: number;
  continuationToken: string | null;
  nextContinuationToken: string | null;
}

export interface GetBucketVersionsQueryParams {
  prefix?: string;
  keyMarker?: string;
  versionIdMarker?: string;
  delimiter?: string;
  maxKeys?: string;
  encodingType?: 'url'
}

export interface getBucketVersionsReturnType extends NormalSuccessResponse {
  objects: Array<IObjectInfo & {
    isLatest: boolean;
    versionId: string;
  }> | undefined;
  deleteMarker: Array<Pick<IObjectInfo, 'name' | 'lastModified' | 'owner'> & {
    versionId: string;
  }> | undefined;
  prefixes: string[] | undefined;
  nextKeyMarker: string | null;
  nextVersionIdMarker: string | null;
  /** depreated; use `nextKeyMarker` */
  nextMarker?: string | null;
  /** depreated; use `nextVersionIdMarker` */
  NextVersionIdMarker?: string | null;
  isTruncated: boolean;
}

export interface ObjectPutOptions extends RequestOptions {
  mime?: string; // custom mime, will send with Content-Type entity header
  meta?: UserMeta; // user meta, will send with x-oss-meta- prefix string e.g.: { uid: 123, pid: 110 }
  callback?: ObjectCallback;
  contentLength?: number;
  method?: string; // append object need
}

export interface ObjectPutReturnType extends NormalSuccessResponse {
  /** object name */
  name: string;
  /** request url */
  url: string;
  /** callback server response data If the callback parameter was set */
  data?: object;
}

export interface ObjectAppendOptions extends RequestOptions {
  /** specify the position which is the content length of the latest object */
  position?: string;
  /** custom mime, will send with Content-Type entity header */
  mime?: string;
  meta?: UserMeta;
}

export interface ObjectAppendReturnType extends ObjectPutReturnType {
  nextAppendPosition: string;
}

export interface ObjectHeadReturnType extends NormalSuccessResponse {
  status: 200 | 304;
  /** if not set or status is 304, meta will be null */
  meta: {
    [props: string]: string;
  } | null
}

export interface ObjectGetOptions extends MultiVersionCommonOptions {
  /** image process params, will send with x-oss-process e.g.: {process: 'image/resize,w_200'} */
  process?: string;
  /** only support Browser.js */
  responseCacheControl?: string
}

export interface ObjectGetReturnType extends NormalSuccessResponse {
  content: Buffer | null;
}

export interface ObjectGetStreamReturnType {
  stream: Writable;
  res: Pick<NormalSuccessResponse['res'], 'status' | 'headers'>;
}

export interface ObjectCopyOptions extends MultiVersionCommonOptions {
  meta?: {
    [props: string]: string
  }
}

export interface ObjectCopyReturnType extends NormalSuccessResponse {
  /**
   * It will be null,
   * if x-oss-copy-source-if-none-match request header is specified, and the ETag value of the source object is the same as the ETag value in the request.
   * or x-oss-copy-source-if-modified-since request header is specified, and the source object has not been modified since the time specified in the request.
   */
  data: {
    etag: string;
    lastModified: string
  } | null;
}

export type ObjectDeleteMultiNames = string[] | Array<{ key: string; versionId?: string }>;
export interface ObjectDeleteMultiOptions extends RequestOptions {
  /**
   * true: includes only objects that fail to be deleted.
   * false: includes the results of all deleted objects.
   */
  quiet?: boolean
}

export interface ObjectDeleteMultiReturnType extends NormalSuccessResponse {
  deleted: Array<{
    Key: string;
    DeleteMarkerVersionId?: string
  }>;
}

export interface ObjectPutSymlinkOptions extends MultiVersionCommonOptions {
  meta?: UserMeta;
  storageClass?: StorageType;
}
