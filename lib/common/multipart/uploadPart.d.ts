import { RequestOptions } from '../../types/params';
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {File} file upload File, whole File
 * @param {Integer} start  part start bytes  e.g: 102400
 * @param {Integer} end  part end bytes  e.g: 204800
 * @param {Object} options
 */
export declare function uploadPart(this: any, name: string, uploadId: string, partNo: number, file: File | string, start: number, end: number, options?: RequestOptions): Promise<{
    name: string;
    etag: string;
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
