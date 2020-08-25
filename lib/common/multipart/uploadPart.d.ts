/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {File} file upload File, whole File
 * @param {Integer} start  part start bytes  e.g: 102400
 * @param {Integer} end  part end bytes  e.g: 204800
 * @param {Object} options
 */
export declare function uploadPart(this: any, name: string, uploadId: string, partNo: number, file: any, start: number, end: number, options?: any): Promise<{
    name: string;
    etag: any;
    res: any;
}>;
