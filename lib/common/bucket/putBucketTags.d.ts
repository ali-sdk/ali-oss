import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * putBucketTags
 * @param {String} name - bucket name
 * @param {Object} tag -  bucket tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */
export declare function putBucketTags(this: Client, name: string, tag: object, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
