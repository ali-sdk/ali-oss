import { NormalSuccessResponse, StorageType } from './params';
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
    objects: Array<{
        name: string;
        url: string;
        lastModified: string;
        etag: string;
        type: 'Normal' | 'Symlink';
        size: number;
        storageClass: StorageType;
        owner: {
            id: string;
            displayName: string;
        };
    }> | undefined;
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
    objects: Array<{
        name: string;
        url: string;
        lastModified: string;
        etag: string;
        type: 'Normal' | 'Symlink';
        size: number;
        storageClass: StorageType;
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
