import { UploadPartOptions } from '../../types/params';
import { _createBuffer } from '../client/_createBuffer';
import { handleUploadPart } from '../../common/multipart/handleUploadPart';
import { OSS } from '../core';

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
  this: OSS,
  name: string,
  uploadId: string,
  partNo: number,
  file: File,
  start: number,
  end: number,
  options: UploadPartOptions = {}
) {
  const data = {
    content: await _createBuffer(file, start, end),
    size: end - start
  };
  return await handleUploadPart.call(this, name, uploadId, partNo, data, options);
}
