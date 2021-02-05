/// <reference types="node" />
import { Readable } from 'stream';
import { Client } from '../../setConfig';
import { RequestOptions } from '../../types/params';
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
export declare function handleUploadPart(this: Client, name: string, uploadId: string, partNo: number, data: {
    stream: Buffer | Readable | null;
    size: number;
}, options?: RequestOptions): Promise<{
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
        data?: any;
    };
}>;
