import { RequestOptions } from '../../types/params';
/**
 * putBucketTags
 * @param {String} name - bucket name
 * @param {Object} tag -  bucket tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */
export declare function putBucketTags(this: any, name: string, tag: object, options?: RequestOptions): Promise<{
    res: any;
    status: any;
}>;
