import { Client } from '../../setConfig';
import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
export declare function restore(this: Client, name: string, options?: MultiVersionCommonOptions): Promise<NormalSuccessResponse>;
