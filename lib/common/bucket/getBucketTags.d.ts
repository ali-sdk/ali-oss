import { RequestOptions } from '../../types/params';
import { GetBucketTagsReturnType } from '../../types/bucket';
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */
export declare function getBucketTags(this: any, name: string, options?: RequestOptions): Promise<GetBucketTagsReturnType>;
