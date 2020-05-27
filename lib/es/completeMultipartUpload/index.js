import callback from '../../common/callback';
import deepCopy from '../../common/utils/deepCopy';


export default async function completeMultipartUpload(client, name, uploadId, parts, options) {
  const completeParts = parts.concat().sort((a, b) => a.number - b.number)
    .filter((item, index, arr) => !index || item.number !== arr[index - 1].number);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CompleteMultipartUpload>\n';
  for (let i = 0; i < completeParts.length; i++) {
    const p = completeParts[i];
    xml += '<Part>\n';
    xml += `<PartNumber>${p.number}</PartNumber>\n`;
    xml += `<ETag>${p.etag}</ETag>\n`;
    xml += '</Part>\n';
  }
  xml += '</CompleteMultipartUpload>';

  options = options || {};
  let opt = {};
  opt = deepCopy(options);
  if (opt.headers) delete opt.headers['x-oss-server-side-encryption'];
  opt.subres = { uploadId };

  const params = client._objectRequestParams('POST', name, opt);
  callback.encodeCallback(params, opt);
  params.mime = 'xml';
  params.content = xml;

  if (!(params.headers && params.headers['x-oss-callback'])) {
    params.xmlResponse = true;
  }
  params.successStatuses = [200];
  const result = await client.request(params);

  const ret = {
    res: result.res,
    bucket: params.bucket,
    name,
    etag: result.res.headers.etag
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
}

