import fs from 'fs';
import { Writable } from 'stream';
import { deleteFileSafe } from '../utils/deleteFileSafe';
import { isObject } from '../utils/isObject';
import { ObjectGetOptions, ObjectGetReturnType } from '../../types/object';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';
import { isWritable } from '../utils/isStream';
import { isString } from '../utils/isString';

/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export async function get(
  this: Client,
  name: string,
  file: string | Writable,
  options: ObjectGetOptions = {}
): Promise<ObjectGetReturnType> {
  let writeStream: any = null;
  let needDestroy = false;

  if (isWritable(file)) {
    writeStream = file;
  } else if (isString(file)) {
    writeStream = fs.createWriteStream(file);
    needDestroy = true;
  } else if (isObject(file)) {
    options = file;
  }

  const isBrowserEnv = process && (process as any).browser;
  const responseCacheControl = options.responseCacheControl === undefined ? 'no-cache' : options.responseCacheControl;
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
    const params = _objectRequestParams.call(this, 'GET', name, options);
    params.writeStream = writeStream;
    params.successStatuses = [200, 206, 304];

    result = await this.request(params);

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

