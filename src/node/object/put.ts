import fs from 'fs';
import path from 'path';
import mime from 'mime';
import is from 'is-type-of';
import { putStream } from './putStream';
import { getFileSize } from '../utils/getFileSize';
import { objectName } from '../../common/utils/objectName';
import { convertMetaToHeaders } from '../../common/utils/convertMetaToHeaders';
import { objectUrl } from '../../common/utils/objectUrl';
import { encodeCallback } from '../../common/utils/encodeCallback';
import { isBuffer } from '../../common/utils/isBuffer';
import { PutObjectOptions } from '../../types/params';

/**
 * put an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url  the OSS sends a callback request to this URL
 *        {String} options.callback.host  The host header value for initiating callback requests
 *        {String} options.callback.body  The value of the request body when a callback is initiated
 *        {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 * @return {Object}
 */
export async function put(this: any, name: string, file: any, options: PutObjectOptions = {}) {
  let content;
  name = objectName(name);

  if (isBuffer(file)) {
    content = file;
  } else if ((is as any).string(file)) {
    const stats = fs.statSync(file);
    if (!stats.isFile()) {
      throw new Error(`${file} is not file`);
    }
    options.mime = options.mime || mime.getType(path.extname(file));
    const stream = fs.createReadStream(file);
    options.contentLength = await getFileSize(file);
    return await putStream.call(this, name, stream, options);
  } else if (is.readableStream(file)) {
    return await putStream.call(this, name, file, options);
  } else {
    throw new TypeError('Must provide String/Buffer/ReadableStream for put.');
  }

  options.headers = options.headers || {};
  convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);

  encodeCallback(params, options);

  params.mime = options.mime;
  params.content = content;
  params.successStatuses = [200];

  const result = await this.request(params);

  const ret: any = {
    name,
    url: objectUrl(name, this.options),
    res: result.res
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
}
