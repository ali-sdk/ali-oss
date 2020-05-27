import copy from 'copy-to';

export default async function _uploadPart(client, name, uploadId, partNo, data, options) {
  options = options || {};
  const opt = {};
  copy(options).to(opt);
  opt.headers = {
    'Content-Length': data.size
  };

  opt.subres = {
    partNumber: partNo,
    uploadId
  };
  const params = client._objectRequestParams('PUT', name, opt);
  params.mime = opt.mime;
  params.stream = data.stream;
  params.successStatuses = [200];

  const result = await client.request(params);

  if (!result.res.headers.etag) {
    throw new Error('Please set the etag of expose-headers in OSS \n https://help.aliyun.com/document_detail/32069.html');
  }

  data.stream = null;
  params.stream = null;
  return {
    name,
    etag: result.res.headers.etag,
    res: result.res
  };
}

