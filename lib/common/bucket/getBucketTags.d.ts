import { RequestOptions } from '../../types/params';
import { GetBucketTagsReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */
export declare function getBucketTags(this: Client, name: string, options?: RequestOptions): Promise<GetBucketTagsReturnType>;
