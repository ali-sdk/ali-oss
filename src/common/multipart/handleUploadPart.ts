import copy from 'copy-to';
import { RequestOptions } from '../../types/params';
import { checkCrc64 } from '../utils/crc64';

const isStreamLike = stream => {
  return stream && stream.pipe;
};

/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */

export async function handleUploadPart(
  this: any,
  name: string,
  uploadId: string,
  partNo: number,
  data: { stream: Buffer | ReadableStream | null; size: number },
  options: RequestOptions = {}
) {
  options.disabledMD5 = options.disabledMD5 === undefined ? true : !!options.disabledMD5;
  const opt: any = {};
  copy(options, false).to(opt);
  opt.headers = opt.headers || {};
  opt.headers['Content-Length'] = data.size;
  delete opt.headers['x-oss-server-side-encryption'];

  opt.subres = {
    partNumber: partNo,
    uploadId
  };
  const params = this._objectRequestParams('PUT', name, opt);
  params.mime = opt.mime;
  if (isStreamLike(data.stream)) {
    params.stream = data.stream;
  } else {
    params.content = data.stream;
  }
  params.disabledMD5 = opt.disabledMD5;
  params.successStatuses = [200];

  const isBrowserEnv = process && (process as any).browser;
  // current part buffer to calculator
  let buffers: any = [];
  if (opt.crc64) {
    if (isBrowserEnv) {
      buffers = params.content;
    } else {
      params.stream.on('data', d => {
        buffers.push(d);
      });
    }
  }

  const result = await this.request(params);

  // check crc64
  if (options.crc64) {
    if (isBrowserEnv) {
      if (
        typeof options.crc64 === 'function' &&
        options.crc64(buffers) !== result.res.headers['x-oss-hash-crc64ecma']
      ) {
        throw new Error('crc64 check fail');
      }
    } else if (!checkCrc64(Buffer.concat(buffers), result.res.headers['x-oss-hash-crc64ecma'])) {
      throw new Error('crc64 check fail');
    }
  }

  if (!result.res.headers.etag) {
    throw new Error(
      'Please set the etag of expose-headers in OSS \n https://help.aliyun.com/document_detail/32069.html'
    );
  }
  data.stream = null;
  params.stream = null;
  return {
    name,
    etag: result.res.headers.etag,
    res: result.res
  };
}
