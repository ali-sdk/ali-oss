import fs from 'fs';
import is from 'is-type-of';
import { deleteFileSafe } from '../utils/deleteFileSafe';
import { isObject } from '../utils/isObject';
import { checkCrc64, checkCrc64File } from '../utils/crc64';
import { GetObjectOptions } from '../../types/params';

/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export async function get(this: any, name: string, file, options: GetObjectOptions = {}) {
  let writeStream: any = null;
  let needDestroy = false;

  if (is.writableStream(file)) {
    writeStream = file;
  } else if ((is as any).string(file)) {
    writeStream = fs.createWriteStream(file);
    needDestroy = true;
  } else if (isObject(file)) {
    options = file;
  }

  const isBrowserEnv = process && (process as any).browser;
  const responseCacheControl = options.responseCacheControl === null ? '' : 'no-cache';
  const defaultSubresOptions =
    isBrowserEnv && responseCacheControl ? { 'response-cache-control': responseCacheControl } : {};
  options.subres = Object.assign(defaultSubresOptions, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }

  if (options.process) {
    options.subres['x-oss-process'] = options.process;
  }

  let result: any;
  try {
    const params = this._objectRequestParams('GET', name, options);
    params.writeStream = writeStream;
    params.successStatuses = [200, 206, 304];

    result = await this.request(params);

    // buffer
    if (options.crc64 && result.data) {
      if (isBrowserEnv) {
        if (
          typeof options.crc64 === 'function' &&
          options.crc64(result.data) !== result.headers['x-oss-hash-crc64ecma']
        ) {
          throw new Error('crc64 check fail');
        }
      } else if (!checkCrc64(result.data, result.headers['x-oss-hash-crc64ecma'])) {
        throw new Error('crc64 check fail');
      }
    }
    // stream
    if (options.crc64 && writeStream) {
      checkCrc64File(writeStream.path, (err, d) => {
        if (err) throw new Error(err.toString());
        if (d !== result.headers['x-oss-hash-crc64ecma']) {
          throw new Error('crc64 check fail');
        }
      });
    }

    if (needDestroy) {
      writeStream.destroy();
    }
  } catch (err) {
    if (needDestroy) {
      writeStream.destroy();
      // should delete the exists file before throw error
      await deleteFileSafe(file);
    }
    throw err;
  }

  return {
    res: result.res,
    content: result.data
  };
}
