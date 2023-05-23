import { MultipleObjectDownloadOptions, MultipleObjectDownloadResult } from '../../types/params';
/**
 * multiple object download
 * @param {object} [options] - multiple download object option
 * @param {number} [options.splitSize=30 * 1024 * 1024] - By default, only files larger than 30MB are downloaded using Shards
 * @param {number} [options.syncNumber=5] - By default, 5 files are download at the same time to avoid timeout and DNS errors. It is recommended not to exceed 10 files
 * @param {string} [path] - The default download path is: __dirname/Downloads
 * @param {number} [partSize] - The default partition size for partition download is 1MB
 * @returns {object} obj
 * @returns {Function} obj.add(objects: TMDownloadStartPara[]) - Add download task
 * @returns {Function} obj.suspend(objectName: string) -  Pause the download of an object
 * @returns {Function} obj.reStart(objectName: string) -  For objects that have been suspended from downloading, start downloading again
 * @returns {Function} obj.delete(objectName: string) - Delete the download task of the specified object
 * @returns {Function} obj.dispose() - Terminate all ongoing download tasks and release the download queue
 */
export declare function multipleDownload(this: any, options?: MultipleObjectDownloadOptions): MultipleObjectDownloadResult;
