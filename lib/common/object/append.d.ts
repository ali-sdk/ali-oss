import { AppendObjectOptions } from '../../types/params';
/**
 * append an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 * @return {Object}
 */
export declare function append(this: any, name: string, file: any, options?: AppendObjectOptions): Promise<any>;
