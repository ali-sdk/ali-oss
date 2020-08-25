import { PutObjectOptions } from '../../types/params';
/**
 * put an object from ReadableStream. If `options.contentLength` is
 * not provided, chunked encoding is used.
 * @param {String} name the object key
 * @param {Readable} stream the ReadableStream
 * @param {Object} options
 * @return {Object}
 */
export declare function putStream(this: any, name: string, stream: any, options?: PutObjectOptions): Promise<any>;
