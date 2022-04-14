import { MultipleObjectDeleteOptions, TMDeleteObject, TMDeleteStartPara, ETaskStatus, MultipleObjectDeleteResult } from '../../types/params';

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
export function multipleDelete(this: any, options?: MultipleObjectDeleteOptions): MultipleObjectDeleteResult {
  const that = this;

  const opt = { syncNumber: 5, pageSize: 1000 };
  Object.assign(opt, options);

  const waits: TMDeleteObject[] = []; // task list
  const suspends: TMDeleteObject[] = []; // suspend or fail list
  const doings: TMDeleteObject[] = []; // doing task

  const dispose = () => {
    waits.length = 0; // clear waits
    suspends.length = 0;

    // stop doings
    for (const item of doings) {
      stopDoing(item.prefix);
    }
    doings.length = 0;
  };

  const stopDoing = (prefix: string) => {
    const index = doings.findIndex(item => item.prefix === prefix);
    if (index === -1) return false;

    const obj = doings[index];
    obj.status = ETaskStatus.wait; // stop delete
    doings.splice(index, 1); // remove doings
    return true;
  };

  const itemSucc = (item: TMDeleteObject) => {
    const index = doings.findIndex(doItem => doItem.prefix === item.prefix);
    if (index > -1) doings.splice(index, 1); // remove doing item
    doDelete(); // recursion
  };

  const itemFail = (item: TMDeleteObject, error) => {
    const index = doings.findIndex(doItem => doItem.prefix === item.prefix);
    if (index > -1) doings.splice(index, 1); // remove doing item
    item.status = ETaskStatus.fail;
    item.message = error.message;
    suspends.push(item);

    doDelete(); // recursion
  };

  const doDelete = () => {
    if (waits.length === 0) {
      return;
    }

    const num = opt.syncNumber - doings.length;
    if (num === 0) return;

    const list = waits.splice(0, num);
    if (list.length > 0) {
      doings.push(...list);

      list.forEach(doItem => {
        const { status } = doItem;
        if (status === ETaskStatus.wait) {
          doItem.status = ETaskStatus.doing;
          exeDelete(doItem, doItem.prefix, undefined); // async doing
        }
      });
    }
  };

  const exeDelete = async (item: TMDeleteObject, prefix, nextToken) => {
    const { getProgress, status } = item;
    if (status !== ETaskStatus.doing) return; // suspend

    try {
      const para = {
        prefix,
        'max-keys': 1000,
        'continuation-token': nextToken
      };
      const res = await that.listV2(para);
      const { prefixes, objects, nextContinuationToken } = res;

      if (prefixes) {
        for (const pre of prefixes) {
          await exeDelete(item, pre, undefined);
        }
      }

      if (nextContinuationToken) {
        await exeDelete(item, item.prefix, nextContinuationToken);
      } else {
        const dres = await that.deleteMulti(objects.map(f => f.name));
        item.progress += dres.deleted.length;
        getProgress(item.progress);
        itemSucc(item);
      }
    } catch (error) {
      itemFail(item, error);
    }
  };

  /**
   * add delete
   * @param {object[]} prefixs - add delete option
   * @param {string} prefixs[].prefix - The name of the directory to delete, for example: /del/
   * @param {Function} prefixs[].getProgress - The callback function gets the number of deleted objects
   * @returns {boolean} - After adding, an exception will be thrown when the new task is being executed
   */
  const add = (prefixs: TMDeleteStartPara[]) => {
    if (waits.some(item => prefixs.some(obj => obj.prefix === item.prefix)) || doings.some(item => prefixs.some(obj => obj.prefix === item.prefix))) {
      throw new Error('The task is in progress. Please use dispose to release the task first');
    }

    prefixs.forEach(item => {
      const { prefix, getProgress } = item;

      waits.push({
        prefix,
        status: ETaskStatus.wait,
        progress: 0,
        getProgress: (res: number) => {
          getProgress(res);
        }
      });
    });

    doDelete();

    return true;
  };

  const suspend = (prefix: string) => {
    let index = doings.findIndex(item => item.prefix === prefix);
    let obj;
    if (index > -1) {
      obj = doings[index];
      doings.splice(index, 1); // remove doings
    } else {
      index = waits.findIndex(item => item.prefix === prefix);
      obj = waits[index];
      waits.splice(index, 1);
    }

    if (index > -1 && obj) {
      obj.status = ETaskStatus.suspend;
      suspends.push(obj);
    }

    return true;
  };

  const reStart = (prefix: string) => {
    const index = suspends.findIndex(item => item.prefix === prefix);
    if (index > -1) {
      const obj = suspends[index];
      obj.status = ETaskStatus.wait;
      obj.message = undefined; // reset error message
      suspends.splice(index, 1);
      waits.unshift(obj); // entries first
    } else throw new Error('object is not suspend');

    return true;
  };

  /**
   * delete task
   * small file is not delete
   */
  const deleteItem = (prefix: string) => {
    let index = waits.findIndex(item => item.prefix === prefix);

    if (index > -1) {
      waits.splice(index, 1);
    } else {
      index = suspends.findIndex(item => item.prefix === prefix);
      if (index > -1) {
        suspends.splice(index, 1);
      } else {
        return stopDoing(prefix);
      }
    }

    return true;
  };

  return {
    add,
    suspend,
    reStart,
    delete: deleteItem,
    dispose
  };
}
