import { RequestOptions } from '../../types/params';
import { handleUploadPart } from './handleUploadPart';

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
export async function uploadPart(
  this: any,
  name: string,
  uploadId: string,
  partNo: number,
  file: File | string,
  start: number,
  end: number,
  options: RequestOptions = {}
) {
  const data = {
    stream: await this._createStream(file, start, end, true),
    size: end - start
  };
  return await handleUploadPart.call(this, name, uploadId, partNo, data, options);
}
