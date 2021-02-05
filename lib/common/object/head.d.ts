import { Client } from '../../setConfig';
import { ObjectHeadReturnType } from '../../types/object';
import { MultiVersionCommonOptions } from '../../types/params';
/**
 * head
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
export declare function head(this: Client, name: string, options?: MultiVersionCommonOptions): Promise<ObjectHeadReturnType>;
