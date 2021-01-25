import copy from 'copy-to';
import { ObjectListUploadsReturnType } from '../../types/object';
import { ListUploadsQuery, RequestOptions } from '../../types/params';

/**
 * List the on-going multipart uploads
 * https://help.aliyun.com/document_detail/31997.html
 * @param {Object} options
 * @return {Array} the multipart uploads
 */

export async function listUploads(
  this: any,
  query: ListUploadsQuery = {},
  options: RequestOptions = {}
): Promise<ObjectListUploadsReturnType> {
  const opt: any = {};
  copy(options).to(opt);
  opt.subres = 'uploads';
  const params = this._objectRequestParams('GET', '', opt);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);
  let uploads = result.data.Upload || [];
  if (!Array.isArray(uploads)) {
    uploads = [uploads];
  }
  uploads = uploads.map((up: { Key: any; UploadId: any; Initiated: any; }) => ({
    name: up.Key,
    uploadId: up.UploadId,
    initiated: up.Initiated
  }));

  return {
    res: result.res,
    uploads,
    bucket: result.data.Bucket,
    nextKeyMarker: result.data.NextKeyMarker,
    nextUploadIdMarker: result.data.NextUploadIdMarker,
    isTruncated: result.data.IsTruncated === 'true'
  };
}
