import { MultiVersionCommonOptions } from '../../types/params';
/**
 * getSymlink
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
export declare function getSymlink(this: any, name: string, options?: MultiVersionCommonOptions): Promise<{
    targetName: string;
    res: any;
}>;
