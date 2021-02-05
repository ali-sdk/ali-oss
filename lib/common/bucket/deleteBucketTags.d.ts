import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * deleteBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 */
export declare function deleteBucketTags(this: Client, name: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
