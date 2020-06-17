/**
 * List the done uploadPart parts
 * @param {String} name object name
 * @param {String} uploadId multipart upload id
 * @param {Object} query
 * {Number} query.max-parts The maximum part number in the response of the OSS. Default value: 1000
 * {Number} query.part-number-marker Starting position of a specific list.
 * {String} query.encoding-type Specify the encoding of the returned content and the encoding type.
 * @param {Object} options
 * @return {Object} result
 */
export declare function listParts(this: any, name: any, uploadId: any, query: any, options?: {}): Promise<{
    res: any;
    uploadId: any;
    bucket: any;
    name: any;
    partNumberMarker: any;
    nextPartNumberMarker: any;
    maxParts: any;
    isTruncated: any;
    parts: any;
}>;
