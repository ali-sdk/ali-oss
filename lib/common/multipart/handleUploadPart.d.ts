/// <reference types="node" />
import { RequestOptions } from '../../types/params';
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
export declare function handleUploadPart(this: any, name: string, uploadId: string, partNo: number, data: {
    stream: Buffer | ReadableStream | null;
    size: number;
}, options?: RequestOptions): Promise<{
    name: string;
    etag: any;
    res: any;
}>;
