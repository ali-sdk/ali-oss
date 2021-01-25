import { CompleteMultipartUploadOptions } from '../../types/params';
import { ObjectCompleteMultipartUploadReturnType } from '../../types/object';
/**
 * Complete a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Array} parts the uploaded parts, each in the structure:
 *        {Integer} number partNo
 *        {String} etag  part etag  uploadPartCopy result.res.header.etag
 * @param {Object} options
 *         {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *         {String} options.callback.url  the OSS sends a callback request to this URL
 *         {String} options.callback.host  The host header value for initiating callback requests
 *         {String} options.callback.body  The value of the request body when a callback is initiated
 *         {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *         {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                   customValue = {
 *                     key1: 'value1',
 *                     key2: 'value2'
 *                   }
 */
export declare function completeMultipartUpload(this: any, name: string, uploadId: string, parts: Array<{
    number: number;
    etag: string;
}>, options?: CompleteMultipartUploadOptions): Promise<ObjectCompleteMultipartUploadReturnType>;
