import { MultipleObjectUploadOptions, MultipleObjectUploadResult } from '../../types/params';
/**
 * multiple object upload
 * @param {object} [options] - multiple upload object option
 * @param {number} [options.splitSize=10 * 1024 * 1024] - By default, only files over 10MB can be uploaded in pieces
 * @param {number} [options.syncNumber=5] - By default, 5 files are uploaded at the same time to avoid timeout and DNS errors. It is recommended not to exceed 10 files
 * @param {number} [options.taskOver] - The task completion event returns the failed task
 * @returns {object} obj
 * @returns {Function} obj.add(objects: TMUploadStartPara[]) - Add upload task, Can be added repeatedly
 * @returns {Function} obj.suspend(objectName: string) -  Pause the upload of an object
 * @returns {Function} obj.reStart(objectName: string) -  For objects that have been suspended from uploading, start uploading again
 * @returns {Function} obj.delete(objectName: string) - Delete the upload task of the specified object
 * @returns {Function} obj.dispose() - Terminate all ongoing upload tasks and release the upload queue
 * @returns {Function} obj.getFails() - Get failed tasks
 */
export declare function multipleUpload(this: any, options?: MultipleObjectUploadOptions): MultipleObjectUploadResult;
