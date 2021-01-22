import { NormalSuccessResponse } from '../../types/params';
import { ObjectPutSymlinkOptions } from '../../types/object';
/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */
export declare function putSymlink(this: any, name: string, targetName: string, options?: ObjectPutSymlinkOptions): Promise<NormalSuccessResponse>;
