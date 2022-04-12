import fs from 'fs';
import path from 'path';
import {
  MultipleObjectDownloadOptions,
  TMDownloadObject,
  MultipleObjectDownloadResult,
  TMDownloadStartPara,
  ETaskStatus,
  EMUploadType
} from '../../types/params';
import { F_OK } from 'constants';

/**
 * multiple download
 * path: Download to ~/downloads by default
 * splitSize: 100MB
 * syncNumber: 5
 */
export function multipleDownload(this: any, options?: MultipleObjectDownloadOptions): MultipleObjectDownloadResult {
  const that = this;

  const defDir = `${process.env.HOME}/Downloads`;
  const splitSize = 10 * 1024 * 1024; // default fragment download is not used within 10MB
  const partSize = 1 * 1024 * 1024; // download part size default 1MB
  const opt = { path: defDir, splitSize, partSize, syncNumber: 5 };
  Object.assign(opt, options);

  const waits: TMDownloadObject[] = []; // task list
  const suspends: TMDownloadObject[] = []; // suspend or fail list
  const doings: TMDownloadObject[] = []; // doing task

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
      that.abortMultipartUpload(obj.name, obj.checkpoint.uploadId); // cancel multi part download
      doings.splice(index, 1); // remove doings
      return true;
    } else {
      return false; // item does not exist (small file is not delete)
    }
  };

  const itemSucc = item => {
    const index = doings.findIndex(doItem => doItem.name === item.name);
    if (index > -1) doings.splice(index, 1); // remove doing item
    doDownload(); // recursion
  };

  const itemFail = (item: TMDownloadObject, error) => {
    const index = doings.findIndex(doItem => doItem.name === item.name);
    if (index > -1) doings.splice(index, 1); // remove doing item
    item.status = ETaskStatus.fail;
    item.error = error;
    suspends.push(item);

    doDownload(); // recursion
  };

  const doDownload = () => {
    if (waits.length === 0) {
      return;
    }

    const num = opt.syncNumber - doings.length;
    if (num === 0) return;

    const list = waits.splice(0, num);
    if (list.length > 0) {
      doings.push(...list);

      list.forEach(async doItem => {
        const { type, status, name, getProgress } = doItem;

        if (status === ETaskStatus.wait) {
          doItem.status = ETaskStatus.doing;

          try {
            const tpath = path.join(opt.path, name);
            try {
              fs.accessSync(tpath, F_OK);
              fs.unlinkSync(tpath); // delete live file
              // eslint-disable-next-line no-empty
            } catch { }

            if (type === EMUploadType.small) {
              const dir = path.resolve(tpath, '..');
              fs.mkdirSync(dir, { recursive: true });
              const { res } = await that.get(name, tpath);
              if (res.statusCode === 200) {
                getProgress(1);
                itemSucc(doItem);
              }
            } else {
              await bigDownload(doItem, 0, partSize);
              fs.unlinkSync(`${tpath}.dcp`);
              getProgress(1);
              itemSucc(doItem);
            }
          } catch (error) {
            itemFail(doItem, error);
          }
        }
      });
    }
  };

  const bigDownload = async (item, start, end) => {
    const { name, size, getProgress } = item; //  getProgress, checkpoint, size

    try {
      const result = await that.get(name, { headers: { Range: `bytes=${start}-${end}` } });
      const filePath = path.join(opt.path, name);
      fs.mkdirSync(path.resolve(filePath, '..'), { recursive: true });
      fs.appendFileSync(filePath, result.content);
      fs.writeFileSync(`${filePath}.dcp`, JSON.stringify({ name, filePath, start, end, successes: true, time: new Date() }));
      getProgress(end / size);

      const maxSize = size - 1; // maxSize: 0 ~ size-1
      if (end < maxSize) {
        start = end + 1;
        end = start + partSize;
        if (end > maxSize) end = maxSize;
        await bigDownload(item, start, end);
      }
    } catch (error) {
      itemFail(item, { error: JSON.stringify(error), start, end });
    }
  };

  /**
   * add download
   * @objects [{name:'test/1.txt', size:1024}]
   */
  const add = async (objects: TMDownloadStartPara[]) => {
    if (waits.some(item => objects.some(obj => obj.name === item.name)) || doings.some(item => objects.some(obj => obj.name === item.name))) {
      throw new Error('The task is in progress. Please use dispose to release the task first');
    }

    for (const item of objects) {
      const { name, getProgress, checkpoint } = item;
      let { size } = item;
      if (size === undefined) {
        // eslint-disable-next-line no-await-in-loop
        const meta = await that.getObjectMeta(name);
        size = parseInt(meta.res.headers['content-length'], 10);
      }

      waits.push({
        type: size < opt.splitSize ? EMUploadType.small : EMUploadType.big,
        name,
        size,
        status: ETaskStatus.wait,
        progress: 0,
        checkpoint,
        getProgress: (res: number) => {
          if (getProgress) getProgress(res, suspends);
        }
      });
    }

    doDownload();

    return true;
  };

  const suspend = (objectName: string) => {
    let index = doings.findIndex(item => item.name === objectName);
    let obj;
    if (index > -1) {
      obj = doings[index];
      if (obj.status === ETaskStatus.doing && obj.type === EMUploadType.big) {
        that.cancel(); // cancel multi part download
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
