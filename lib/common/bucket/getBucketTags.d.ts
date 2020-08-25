import { RequestOptions } from '../../types/params';
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */
export declare function getBucketTags(this: any, name: string, options?: RequestOptions): Promise<{
    status: any;
    res: any;
    tag: {};
}>;
