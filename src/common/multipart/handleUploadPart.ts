import copy from 'copy-to';
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */

export async function handleUploadPart(this: any, name, uploadId, partNo, data, options = {}) {
  const opt: any = {};
  copy(options, false).to(opt);
  opt.headers = {
    'Content-Length': data.size
  };

  opt.subres = {
    partNumber: partNo,
    uploadId
  };
  const params = this._objectRequestParams('PUT', name, opt);
  params.mime = opt.mime;
  params.stream = data.stream;
  params.successStatuses = [200];

  const result = await this.request(params);

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
