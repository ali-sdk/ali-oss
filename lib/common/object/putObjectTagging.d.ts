import { Tag, MultiVersionCommonOptions } from '../../types/params';
/**
 * putObjectTagging
 * @param {String} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */
export declare function putObjectTagging(this: any, name: string, tag: Tag, options?: MultiVersionCommonOptions): Promise<{
    res: any;
    status: any;
}>;
