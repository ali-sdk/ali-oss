import { NormalSuccessResponseWithStatus, RequestOptions, Versioning } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */
export declare function putBucketVersioning(this: Client, name: string, status: Versioning, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
