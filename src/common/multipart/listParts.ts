import copy from 'copy-to';
import { Client } from '../../setConfig';
import { ObjectListPartsReturnType } from '../../types/object';
import { RequestOptions } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';

interface ListPartsQuery {
  'max-parts'?: number;
  'part-number-marker'?: number;
  'encoding-type'?: 'url';
}

/**
 * List the done uploadPart parts
 * @param {String} name object name
 * @param {String} uploadId multipart upload id
 * @param {Object} query
 * {Number} query.max-parts The maximum part number in the response of the OSS. Default value: 1000
 * {Number} query.part-number-marker Starting position of a specific list.
 * {String} query.encoding-type Specify the encoding of the returned content and the encoding type.
 * @param {Object} options
 * @return {Object} result
 */


export async function listParts(
  this: Client,
  name: string,
  uploadId: string,
  query: ListPartsQuery = {},
  options: RequestOptions = {}
): Promise<ObjectListPartsReturnType> {
  const opt: any = {};
  copy(options).to(opt);
  opt.subres = {
    uploadId,
  };
  const params = _objectRequestParams.call(this, 'GET', name, opt);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res,
    uploadId: result.data.UploadId,
    bucket: result.data.Bucket,
    name: result.data.Key,
    partNumberMarker: result.data.PartNumberMarker,
    nextPartNumberMarker: result.data.NextPartNumberMarker,
    maxParts: result.data.MaxParts,
    isTruncated: result.data.IsTruncated,
    parts: result.data.Part || [],
  };
}
