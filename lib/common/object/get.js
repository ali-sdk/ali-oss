const fs = require('fs');
const is = require('is-type-of');
const { checkCrc64, checkCrc64File } = require('../utils/crc64');

const proto = exports;
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
proto.get = async function get(name, file, options = {}) {
  let writeStream = null;
  let needDestroy = false;

  if (is.writableStream(file)) {
    writeStream = file;
  } else if (is.string(file)) {
    writeStream = fs.createWriteStream(file);
    needDestroy = true;
  } else {
    // get(name, options)
    options = file;
  }

  options = options || {};
  const isBrowserEnv = process && process.browser;
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

  let result;
  try {
    const params = this._objectRequestParams('GET', name, options);
    params.writeStream = writeStream;
    params.successStatuses = [200, 206, 304];

    result = await this.request(params);

    // buffer
    if (options.crc64 && result.data) {
      if (isBrowserEnv) {
        if (options.crc64(result.data) !== result.headers['x-oss-hash-crc64ecma']) {
          throw new Error('crc64 check fail');
        }
      } else if (!checkCrc64(result.data, result.headers['x-oss-hash-crc64ecma'])) {
        throw new Error('crc64 check fail');
      }
    }
    // stream
    if (options.crc64 && writeStream) {
      checkCrc64File(writeStream.path, (err, d) => {
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
      await this._deleteFileSafe(file);
    }
    throw err;
  }

  return {
    res: result.res,
    content: result.data
  };
};
