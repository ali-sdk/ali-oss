/**
 * Upload a part copy in a multipart from the source bucket/object
 * used with initMultipartUpload and completeMultipartUpload.
 * @param {String} name copy object name
 * @param {String} uploadId the upload id
 * @param {Number} partNo the part number
 * @param {String} range  like 0-102400  part size need to copy
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 * @param {Object} options
 */
export declare function uploadPartCopy(this: any, name: any, uploadId: any, partNo: any, range: any, sourceData: any, options?: any): Promise<{
    name: any;
    etag: any;
    res: any;
}>;
