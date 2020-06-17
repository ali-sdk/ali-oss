/**
  * append an object from String(file path)/Buffer/ReadableStream
  * @param {String} name the object key
  * @param {Mixed} file String(file path)/Buffer/ReadableStream
  * @param {Object} options
  * @return {Object}
  */

 export async function append(this: any, name, file, options: any = {}) {
  const { put = this.put } = options;
  if (typeof put !== 'function') {
    throw 'please set put in options, put path is browser/object/put'
  }
  if (options.position === undefined) options.position = '0';
  options.subres = {
    append: '',
    position: options.position
  };
  options.method = 'POST';

  const result = await put.call(this, name, file, options);
  result.nextAppendPosition = result.res.headers['x-oss-next-append-position'];
  return result;
};