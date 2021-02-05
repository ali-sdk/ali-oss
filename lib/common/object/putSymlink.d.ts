import { NormalSuccessResponse } from '../../types/params';
import { ObjectPutSymlinkOptions } from '../../types/object';
import { Client } from '../../setConfig';
/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */
export declare function putSymlink(this: Client, name: string, targetName: string, options?: ObjectPutSymlinkOptions): Promise<NormalSuccessResponse>;
