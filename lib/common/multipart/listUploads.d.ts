/**
 * List the on-going multipart uploads
 * https://help.aliyun.com/document_detail/31997.html
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
export declare function listUploads(this: any, query: any, options: any): Promise<{
    res: any;
    uploads: any;
    bucket: any;
    nextKeyMarker: any;
    nextUploadIdMarker: any;
    isTruncated: boolean;
}>;
