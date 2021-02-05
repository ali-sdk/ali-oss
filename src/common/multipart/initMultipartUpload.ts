import copy from 'copy-to';
import { convertMetaToHeaders } from '../utils/convertMetaToHeaders';
import { InitMultipartUploadOptions, NormalSuccessResponse } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';

export async function initMultipartUpload(this: Client, name: string, options: InitMultipartUploadOptions = {}) {
  const opt: any = {};
  copy(options).to(opt);
  opt.headers = opt.headers || {};
  convertMetaToHeaders(options.meta, opt.headers);

  opt.subres = 'uploads';
  const params = _objectRequestParams.call(this, 'POST', name, opt);
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
