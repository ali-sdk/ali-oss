import { MultipleObjectDeleteOptions, MultipleObjectDeleteResult } from '../../types/params';
/**
 * multiple delete
 * pageSize: 1000
 */
/**
 * Delete directory
 * @param {object} [options] - Delete directory option
 * @param {number} [options.syncNumber=5] - By default, up to 5 directories can be deleted at the same time
 * @param {number} [pageSize=1000] - By default, each directory can delete 1000 at a time, and only 1000 at most
 * @returns {object} obj
 * @returns {Function} obj.add(prefixs: TMDeleteStartPara[]) - Add delete task
 * @returns {Function} obj.suspend(prefix: string) -  Pause the delete of an object
 * @returns {Function} obj.reStart(prefix: string) -  For objects that have been suspended from deleting, start deleting again
 * @returns {Function} obj.delete(prefix: string) - Delete the delete task of the specified object
 * @returns {Function} obj.dispose() - Terminate all ongoing delete tasks and release the delete queue
 */
export declare function multipleDelete(this: any, options?: MultipleObjectDeleteOptions): MultipleObjectDeleteResult;
