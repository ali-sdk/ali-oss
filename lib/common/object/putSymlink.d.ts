import { putSymlinkOptions } from '../../types/params';
/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */
export declare function putSymlink(this: any, name: string, targetName: string, options?: putSymlinkOptions): Promise<{
    res: any;
}>;
