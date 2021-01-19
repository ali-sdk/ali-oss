import { NormalSuccessResponseWithStatus, RequestOptions, Versioning } from '../../types/params';
/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */
export declare function putBucketVersioning(this: any, name: string, status: Versioning, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
