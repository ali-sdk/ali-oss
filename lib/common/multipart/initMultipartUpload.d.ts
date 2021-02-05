import { InitMultipartUploadOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function initMultipartUpload(this: Client, name: string, options?: InitMultipartUploadOptions): Promise<{
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
        data?: any;
    };
    bucket: string;
    name: string;
    uploadId: string;
}>;
