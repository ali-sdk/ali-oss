import copy from 'copy-to';
import _convertMetaToHeaders from '../utils/_convertMetaToHeaders';

export default async function initMultipartUpload(client, name, options) {
  options = options || {};
  const opt = {};
  copy(options).to(opt);
  opt.headers = opt.headers || {};
  _convertMetaToHeaders(options.meta, opt.headers);

  opt.subres = 'uploads';
  const params = client._objectRequestParams('POST', name, opt);
  params.mime = options.mime;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await client.request(params);

  return {
    res: result.res,
    bucket: result.data.Bucket,
    name: result.data.Key,
    uploadId: result.data.UploadId
  };
}
