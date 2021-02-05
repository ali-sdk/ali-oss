import { Client } from '../../setConfig';
import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
/**
 * delete
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
export declare function deleteObject(this: Client, name: string, options?: MultiVersionCommonOptions): Promise<NormalSuccessResponse>;
