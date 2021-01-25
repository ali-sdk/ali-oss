import copy from 'copy-to';
import { convertMetaToHeaders } from '../utils/convertMetaToHeaders';
import { InitMultipartUploadOptions, NormalSuccessResponse } from '../../types/params';

export async function initMultipartUpload(this: any, name: string, options: InitMultipartUploadOptions = {}) {
  const opt: any = {};
  copy(options).to(opt);
  opt.headers = opt.headers || {};
  convertMetaToHeaders(options.meta, opt.headers);

  opt.subres = 'uploads';
  const params = this._objectRequestParams('POST', name, opt);
  params.mime = options.mime;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res as NormalSuccessResponse['res'],
    bucket: result.data.Bucket as string,
    name: result.data.Key as string,
    uploadId: result.data.UploadId as string
  };
}
