import { ObjectHeadReturnType } from '../../types/object';
import { MultiVersionCommonOptions } from '../../types/params';
/**
 * head
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
export declare function head(this: any, name: string, options?: MultiVersionCommonOptions): Promise<ObjectHeadReturnType>;
