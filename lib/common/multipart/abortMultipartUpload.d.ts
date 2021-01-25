import { RequestOptions } from '../../types/params';
/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
export declare function abortMultipartUpload(this: any, name: string, uploadId: string, options?: RequestOptions): Promise<{
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
}>;
