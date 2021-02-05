/// <reference types="node" />
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
export declare function append(this: Client & {
    put?: Function;
}, name: string, file: string | Buffer | Readable, options?: ObjectAppendOptions): Promise<ObjectAppendReturnType>;
