import { MultipartUploadCopySourceData, MultipartUploadOptions, MultiVersionCommonOptions } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * @param {String} name copy object name
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 *        {Number} sourceData.startOffset  data copy start byte offset, e.g: 0
 *        {Number} sourceData.endOffset  data copy end byte offset, e.g: 102400
 * @param {Object} options
 *        {Number} options.partSize
 */
export declare function multipartUploadCopy(this: Client, name: string, sourceData: MultipartUploadCopySourceData, options?: MultipartUploadOptions & MultiVersionCommonOptions): Promise<import("../../types").ObjectCompleteMultipartUploadReturnType>;
export declare function _resumeMultipartCopy(this: Client, checkpoint: any, sourceData: any, options: any): Promise<import("../../types").ObjectCompleteMultipartUploadReturnType>;
export declare function _divideMultipartCopyParts(fileSize: any, partSize: any, startOffset: any): any;
