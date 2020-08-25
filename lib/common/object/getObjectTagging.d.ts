import { MultiVersionCommonOptions } from '../../types/params';
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */
export declare function getObjectTagging(this: any, name: string, options?: MultiVersionCommonOptions): Promise<{
    status: any;
    res: any;
    tag: {};
}>;
