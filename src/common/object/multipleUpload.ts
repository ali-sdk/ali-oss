import {
  MultipleObjectUploadOptions,
  TMUploadObject,
  MultipleObjectUploadResult,
  TMUploadStartPara,
  ETaskStatus,
  EMUploadType
} from '../../types/params';

/**
 * multiple upload
 * splitSize: 10MB
 * syncNumber: 5
 */
export function multipleUpload(this: any, options?: MultipleObjectUploadOptions): MultipleObjectUploadResult {
  const that = this;

  // default fragment upload is not used within 10MB
  const splitSize = 10 * 1024 * 1024;
  const opt = { splitSize, syncNumber: 5 };
  Object.assign(opt, options);

  const waits: TMUploadObject[] = []; // task list
  const suspends: TMUploadObject[] = []; // suspend or fail list
  const doings: TMUploadObject[] = []; // doing task

  const dispose = () => {
    waits.length = 0; // clear waits
    suspends.length = 0;

    // stop doings
    for (const item of doings) {
      stopDoing(item.name);
    }
    doings.length = 0;
  };

  const stopDoing = (objectName: string) => {
    const index = doings.findIndex(item => item.name === objectName);
    if (index === -1) return false;

    const obj = doings[index];
    if (obj.checkpoint && obj.type === EMUploadType.big) {
      that.abortMultipartUpload(obj.name, obj.checkpoint.uploadId); // cancel multi part upload
      doings.splice(index, 1); // remove doings
      return true;
    } else {
      return false; // item does not exist (small file is not delete)
    }
  };

  const itemSucc = item => {
    const index = doings.findIndex(doItem => doItem.name === item.name);
    // console.log('itemsucc--', index, item.name);
    if (index > -1) doings.splice(index, 1); // remove doing item
    doUpload(); // recursion
  };

  const itemFail = (item, error) => {
    const index = doings.findIndex(doItem => doItem.name === item.name);
    if (index > -1) doings.splice(index, 1); // remove doing item
    item.status = ETaskStatus.fail;
    item.message = error.message;
    suspends.push(item);

    doUpload(); // recursion
  };

  const doUpload = () => {
    if (waits.length === 0) {
      return;
    }

    const num = opt.syncNumber - doings.length;
    if (num === 0) return;

    const list = waits.splice(0, num);
    if (list.length > 0) {
      doings.push(...list);

      list.forEach(async doItem => {
        const { type, status, name, filePath, getProgress, checkpoint } = doItem;
        if (status === ETaskStatus.wait) {
          doItem.status = ETaskStatus.doing;

          try {
            if (type === EMUploadType.small) {
              const { res } = await that.put(name, filePath);
              if (res.statusCode === 200) {
                getProgress(1);
                itemSucc(doItem);
              }
            } else {
              const { res } = await that.multipartUpload(name, filePath, {
                checkpoint,
                progress: (p, cpt) => {
                  doItem.checkpoint = cpt;
                  getProgress(p, cpt);
                }
              });
              if (res.statusCode === 200) {
                getProgress(1);
                itemSucc(doItem);
              }
            }
          } catch (error) {
            itemFail(doItem, error);
          }
        }
      });
    }
  };

  /**
   * add upload
   * @objects [{name:'test/1.txt', path:'D://1.txt', size:1024}]
   */
  const add = (objects: TMUploadStartPara[]) => {
    if (waits.some(item => objects.some(obj => obj.name === item.name)) || doings.some(item => objects.some(obj => obj.name === item.name))) {
      throw new Error('The task is in progress. Please use dispose to release the task first');
    }

    objects.forEach(item => {
      const { name, filePath, size, getProgress, checkpoint } = item;

      waits.push({
        // id: `${new Date().valueOf()}-${length}`,
        type: size < opt.splitSize ? EMUploadType.small : EMUploadType.big,
        name,
        filePath,
        size,
        status: ETaskStatus.wait,
        progress: 0,
        checkpoint,
        getProgress: (res: number) => {
          getProgress(res);
        }
      });
    });

    doUpload();

    return true;
  };

  const suspend = (objectName: string) => {
    let index = doings.findIndex(item => item.name === objectName);
    let obj;
    if (index > -1) {
      obj = doings[index];
      if (obj.status === ETaskStatus.doing && obj.type === EMUploadType.big) {
        that.cancel(); // cancel multi part upload
        doings.splice(index, 1); // remove doings
      } else index = -1; // small file is not suspend
    } else {
      index = waits.findIndex(item => item.name === objectName);
      obj = waits[index];
      waits.splice(index, 1);
    }

    if (index > -1 && obj) {
      obj.status = ETaskStatus.suspend;
      suspends.push(obj);
    }

    return true;
  };

  const reStart = (objectName: string) => {
    const index = suspends.findIndex(item => item.name === objectName);
    if (index > -1) {
      const obj = suspends[index];
      obj.status = ETaskStatus.wait;
      obj.message = undefined; // reset error message
      suspends.splice(index, 1);
      waits.unshift(obj); // entries first
    }

    return true;
  };

  /**
   * delete task
   * small file is not delete
   */
  const deleteItem = (objectName: string) => {
    let index = waits.findIndex(item => item.name === objectName);

    if (index > -1) {
      waits.splice(index, 1);
    } else {
      index = suspends.findIndex(item => item.name === objectName);
      if (index > -1) {
        suspends.splice(index, 1);
      } else {
        return stopDoing(objectName);
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
