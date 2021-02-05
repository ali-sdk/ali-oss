import { RequestOptions } from '../../types/params';
import { abortMultipartUpload } from '../../common/multipart/abortMultipartUpload';
import { OSS } from '../core';

/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
export function cancel(
  this: OSS,
  abort: { name: string; uploadId: string; options: RequestOptions }
) {
  this.options.cancelFlag = true;
  if (abort) {
    abortMultipartUpload.call(this, abort.name, abort.uploadId, abort.options);
  }
}
