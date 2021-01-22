/// <reference types="node" />
import { Writable } from 'stream';
import { ObjectGetOptions, ObjectGetReturnType } from '../../types/object';
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export declare function get(this: any, name: string, file: string | Writable, options?: ObjectGetOptions): Promise<ObjectGetReturnType>;
