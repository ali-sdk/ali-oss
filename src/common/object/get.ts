import fs from 'fs';
import is from 'is-type-of';
import { deleteFileSafe } from '../utils/deleteFileSafe';
import { isObject } from '../utils/isObject';

/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export async function get(this: any, name, file, options: any = {}) {
  let writeStream: any = null;
  let needDestroy = false;

  if (is.writableStream(file)) {
    writeStream = file;
  } else if (is.string(file)) {
    writeStream = fs.createWriteStream(file);
    needDestroy = true;
  } else if (isObject(file)) {
    options = file;
  }

  options.subres = Object.assign({}, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }

  if (options.process) {
    options.subres['x-oss-process'] = options.process;
  }

  let result: { res: any; data: any; };
  try {
    const params = this._objectRequestParams('GET', name, options);
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
};
