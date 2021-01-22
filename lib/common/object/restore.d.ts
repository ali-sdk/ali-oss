import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
export declare function restore(this: any, name: string, options?: MultiVersionCommonOptions): Promise<NormalSuccessResponse>;
