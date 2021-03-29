import copy from 'copy-to';
import { Readable } from 'stream';
import { Client } from '../../setConfig';
import { NormalSuccessResponse, UploadPartOptions } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';

/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
export async function handleUploadPart(this: Client, name: string, uploadId: string, partNo: number, data: { stream: Readable | null, size: number } | { content: Buffer, size: number }, options: UploadPartOptions = {}) {
  const opt: any = {};
  copy(options, false).to(opt);
  opt.headers = opt.headers || {};
  opt.headers['Content-Length'] = data.size;
  delete opt.headers['x-oss-server-side-encryption'];

  opt.subres = {
    partNumber: partNo,
    uploadId
  };
  const params = _objectRequestParams.call(this, 'PUT', name, opt);
  params.mime = opt.mime;

  const { size, ...body } = data;
  Object.assign(params, body);

  params.successStatuses = [200];
  params.disabledMD5 = options.disabledMD5;

  const result: NormalSuccessResponse = await this.request(params);

  if (!result.res.headers.etag) {
    throw new Error('Please set the etag of expose-headers in OSS \n https://help.aliyun.com/document_detail/32069.html');
  }
  if ('stream' in data) {
    data.stream = null;
    params.stream = null;
  }
  return {
    name,
    etag: result.res.headers.etag,
    res: result.res
  };
}
