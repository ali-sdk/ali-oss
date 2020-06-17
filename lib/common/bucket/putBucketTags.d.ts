/**
 * putBucketTags
 * @param {String} name - bucket name
 * @param {Object} tag -  bucket tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */
export declare function putBucketTags(this: any, name: any, tag: any, options?: {}): Promise<{
    res: any;
    status: any;
}>;
