import copy from 'copy-to';
import { _stop } from '../client/_stop';

/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
export async function abortMultipartUpload(this: any, name: string, uploadId: string, options: any = {}) {
  _stop.call(this);
  const opt: any = {};
  copy(options).to(opt);
  opt.subres = { uploadId };
  const params = this._objectRequestParams('DELETE', name, opt);
  params.successStatuses = [204];

  const result = await this.request(params);
  return {
    res: result.res
  };
}
