import { abortMultipartUpload } from "../multipart/abortMultipartUpload";

/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
export function cancel(this: any, abort: { name: string; uploadId: string; options: string; }) {
  this.options.cancelFlag = true;
  if (abort) {
    abortMultipartUpload.call(this, abort.name, abort.uploadId, abort.options);
  }
};