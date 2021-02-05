import { RequestOptions } from '../../types/params';
import { OSS } from '../core';
/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
export declare function cancel(this: OSS, abort: {
    name: string;
    uploadId: string;
    options: RequestOptions;
}): void;
