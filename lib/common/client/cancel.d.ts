import { RequestOptions } from '../../types/params';
/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
export declare function cancel(this: any, abort: {
    name: string;
    uploadId: string;
    options: RequestOptions;
}): void;
