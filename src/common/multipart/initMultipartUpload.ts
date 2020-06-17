import copy from 'copy-to';
import { convertMetaToHeaders } from '../utils/convertMetaToHeaders';

export async function initMultipartUpload(this: any, name, options: any = {}) {
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
    res: result.res,
    bucket: result.data.Bucket,
    name: result.data.Key,
    uploadId: result.data.UploadId
  };
}
