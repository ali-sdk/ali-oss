import { deepCopy } from '../utils/deepCopy';
import { encodeCallback } from '../utils/encodeCallback';
import { obj2xml } from '../utils/obj2xml';
import { CompleteMultipartUploadOptions } from '../../types/params';

/**
 * Complete a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Array} parts the uploaded parts, each in the structure:
 *        {Integer} number partNo
 *        {String} etag  part etag  uploadPartCopy result.res.header.etag
 * @param {Object} options
 *         {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *         {String} options.callback.url  the OSS sends a callback request to this URL
 *         {String} options.callback.host  The host header value for initiating callback requests
 *         {String} options.callback.body  The value of the request body when a callback is initiated
 *         {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *         {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                   customValue = {
 *                     key1: 'value1',
 *                     key2: 'value2'
 *                   }
 */

export async function completeMultipartUpload(
  this: any,
  name: string,
  uploadId: string,
  parts: Array<{ number: number; etag: string }>,
  options: CompleteMultipartUploadOptions = {}
) {
  const completeParts = parts
    .concat()
    .sort((a: { number: number }, b: { number: number }) => a.number - b.number)
    .filter(
      (item: { number: number }, index: number, arr: any[]) =>
        !index || item.number !== arr[index - 1].number
    );

  const xmlParamObj = {
    CompleteMultipartUpload: {
      Part: completeParts.map((_: { number: number; etag: string }) => ({
        PartNumber: _.number,
        ETag: _.etag,
      })),
    },
  };

  const opt: any = deepCopy(options);
  if (opt.headers) delete opt.headers['x-oss-server-side-encryption'];
  opt.subres = { uploadId };

  const params = this._objectRequestParams('POST', name, opt);
  encodeCallback(params, opt);
  params.mime = 'xml';
  params.content = obj2xml(xmlParamObj, { headers: true });

  if (!(params.headers && params.headers['x-oss-callback'])) {
    params.xmlResponse = true;
  }
  params.successStatuses = [200];
  const result = await this.request(params);

  const ret: any = {
    res: result.res,
    bucket: params.bucket,
    name,
    etag: result.res.headers.etag,
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
}
