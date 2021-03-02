import { Client } from '../../setConfig';
import { MultiVersionCommonOptions } from '../../types/params';
/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
export declare function _getObjectMeta(this: Client, bucket: string, name: string, options?: MultiVersionCommonOptions): Promise<import("../../types").ObjectHeadReturnType>;
