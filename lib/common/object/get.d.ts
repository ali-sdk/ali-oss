/// <reference types="node" />
import { Writable } from 'stream';
import { ObjectGetOptions, ObjectGetReturnType } from '../../types/object';
import { Client } from '../../setConfig';
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export declare function get(this: Client, name: string, file?: string | Writable | undefined, options?: ObjectGetOptions): Promise<ObjectGetReturnType>;
