/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
export declare function handleUploadPart(this: any, name: any, uploadId: any, partNo: any, data: any, options?: {}): Promise<{
    name: any;
    etag: any;
    res: any;
}>;
