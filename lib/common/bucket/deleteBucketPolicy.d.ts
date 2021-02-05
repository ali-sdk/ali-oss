import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
export declare function deleteBucketPolicy(this: Client, bucketName: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
