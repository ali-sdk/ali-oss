import { NormalSuccessResponse, ObjectType, StorageType } from './params';
interface IObjectInfo {
    name: string;
    url: string;
    lastModified: string;
    etag: string;
    type: ObjectType;
    size: number;
    storageClass: StorageType;
    owner: {
        id: string;
        displayName: string;
    };
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
    objects: IObjectInfo[] | undefined;
    /** If the delimiter parameter is specified in the request, the response contains the prefixes element.  */
    prefixes: string[] | null;
    nextMarker: string | null;
    isTruncated: boolean;
}
export interface ObjectListV2QueryParams {
    /** The prefix that the returned object names must contain. */
    prefix?: string;
    /** The character used to group objects by name. If you specify the `delimiter` parameter in the request, the response contains the prefixes element.  */
    delimiter?: string;
    /** Specifies the Start-after value from which to start the list. */
    'start-after'?: string;
    /** The token from which the List operation must start. */
    'continuation-token'?: string;
    /** The maximum number of objects to return. Default value: 100, max value: 1000. */
    'max-keys'?: string;
    /** The encoding type of the object name in the response. */
    'encoding-type'?: 'url';
    /** Specifies whether to include the owner information in the response. */
    'fetch-owner'?: boolean;
}
export interface ObjectListV2ReturnType extends NormalSuccessResponse {
    objects: Array<Omit<IObjectInfo, 'owner'> & {
        owner: {
            id: string;
            displayName: string;
        } | null;
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
    encodingType?: 'url';
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
export interface ObjectPutReturnType extends NormalSuccessResponse {
    /** object name */
    name: string;
    /** request url */
    url: string;
    /** callback server response data If the callback parameter was set */
    data?: object;
}
export {};
