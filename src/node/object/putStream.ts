import { Transform, Readable } from 'stream';
import pump from 'pump';
import { objectName } from '../../common/utils/objectName';
import { convertMetaToHeaders } from '../../common/utils/convertMetaToHeaders';
import { objectUrl } from '../../common/utils/objectUrl';
import { encodeCallback } from '../../common/utils/encodeCallback';
import { PutObjectOptions } from '../../types/params';

/**
 * put an object from ReadableStream. If `options.contentLength` is
 * not provided, chunked encoding is used.
 * @param {String} name the object key
 * @param {Readable} stream the ReadableStream
 * @param {Object} options
 * @return {Object}
 */
export async function putStream(this: any, name: string, stream: Readable, options: PutObjectOptions = {}) {
  options.headers = options.headers || {};
  name = objectName(name);
  if (options.contentLength) {
    options.headers['Content-Length'] = options.contentLength;
  } else {
    options.headers['Transfer-Encoding'] = 'chunked';
  }
  convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = this._objectRequestParams(method, name, options);
  encodeCallback(params, options);
  params.mime = options.mime;

  const transform = new Transform();
  // must remove http stream header for signature
  transform._transform = function _transform(chunk, _encoding, done) {
    this.push(chunk);
    done();
  };

  params.stream = pump(stream, transform);
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

