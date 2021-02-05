import { Readable } from 'stream';
import { Client } from '../../setConfig';
import { ObjectAppendOptions, ObjectAppendReturnType } from '../../types/object';

/**
 * append an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 * @return {Object}
 */

export async function append(
  this: Client & { put?: Function },
  name: string,
  file: string | Buffer | Readable,
  options: ObjectAppendOptions = {}
): Promise<ObjectAppendReturnType> {
  const { put } = this;
  if (typeof put !== 'function') {
    throw 'please set put in options, put path is browser/object/put';
  }
  if (options.position === undefined) options.position = '0';
  options.subres = {
    append: '',
    position: options.position,
  };
  const result = await put.call(this, name, file, Object.assign({ method: 'POST' }, options));
  return Object.assign(result, { nextAppendPosition: result.res.headers['x-oss-next-append-position'] });
}
