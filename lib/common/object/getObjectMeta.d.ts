import { MultiVersionCommonOptions, NormalSuccessResponseWithStatus } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * getObjectMeta
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
export declare function getObjectMeta(this: Client, name: string, options?: MultiVersionCommonOptions): Promise<NormalSuccessResponseWithStatus>;
