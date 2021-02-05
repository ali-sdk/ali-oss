import copy from 'copy-to';
import { Client } from '../../setConfig';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { _stop } from '../client/_stop';

/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
export async function abortMultipartUpload(this: Client, name: string, uploadId: string, options: RequestOptions = {}) {
  _stop.call(this);
  const opt: any = {};
  copy(options).to(opt);
  opt.subres = { uploadId };
  const params = _objectRequestParams.call(this, 'DELETE', name, opt);
  params.successStatuses = [204];

  const result: NormalSuccessResponse = await this.request(params);
  return {
    res: result.res
  };
}
