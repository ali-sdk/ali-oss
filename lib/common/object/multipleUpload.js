"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleUpload = void 0;
const params_1 = require("../../types/params");
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
function multipleUpload(options) {
    const that = this;
    // default fragment upload is not used within 10MB
    const splitSize = 10 * 1024 * 1024;
    const opt = {
        splitSize,
        syncNumber: 5,
        taskOver: (_objects) => { }
    };
    Object.assign(opt, options);
    const waits = []; // task list
    const suspends = []; // suspend or fail list
    const doings = []; // doing task
    let _isDoing = false;
    const dispose = () => {
        waits.length = 0; // clear waits
        suspends.length = 0;
        // stop doings
        for (const item of doings) {
            try {
                stopDoing(item.name);
                // eslint-disable-next-line no-empty
            }
            catch (_a) { }
        }
        doings.length = 0;
        return true;
    };
    /**
     * Cancel the ongoing slice upload task. It cannot be cancelled without a checkpoint
     * @param {string} objectName - object name, Path without bucket name
     * @returns {boolean} - Cancel successfully
    */
    const stopDoing = (objectName) => {
        const index = doings.findIndex(item => item.name === objectName);
        if (index === -1)
            throw new Error('not find doing item');
        const obj = doings[index];
        if (obj.type === params_1.EMUploadType.small) {
            throw new Error('small file is not delete');
        }
        if (obj.checkpoint) {
            that.abortMultipartUpload(obj.name, obj.checkpoint.uploadId); // cancel multi part upload
            doings.splice(index, 1); // remove doings
            return true;
        }
        else {
            throw new Error('item is not get checkpoint');
        }
    };
    const itemSucc = item => {
        const index = doings.findIndex(doItem => doItem.name === item.name);
        if (index > -1)
            doings.splice(index, 1); // remove doing item
        doUpload(); // recursion
    };
    const itemFail = (item, error) => {
        const index = doings.findIndex(doItem => doItem.name === item.name);
        if (index > -1)
            doings.splice(index, 1); // remove doing item
        // not is suspend
        if ((error === null || error === void 0 ? void 0 : error.name) !== 'cancel') {
            item.status = params_1.ETaskStatus.fail;
            item.message = error.message;
            suspends.push(item);
        }
        doUpload(); // recursion
    };
    const doUpload = () => {
        if (waits.length === 0) {
            _isDoing = false;
            const { taskOver } = opt;
            if (taskOver && typeof taskOver === 'function' && doings.length === 0) {
                taskOver(getFails());
            }
            return;
        }
        _isDoing = true;
        const num = opt.syncNumber - doings.length;
        if (num === 0)
            return;
        const list = waits.splice(0, num);
        if (list.length > 0) {
            doings.push(...list);
            list.forEach(async (doItem) => {
                const { type, status, name, filePath, getProgress, checkpoint } = doItem;
                if (status === params_1.ETaskStatus.wait) {
                    doItem.status = params_1.ETaskStatus.doing;
                    try {
                        if (type === params_1.EMUploadType.small) {
                            const { res } = await that.put(name, filePath);
                            if (res.statusCode === 200) {
                                getProgress(1);
                                itemSucc(doItem);
                            }
                        }
                        else {
                            const { res } = await that.multipartUpload(name, filePath, {
                                checkpoint,
                                progress: (p, cpt) => {
                                    doItem.checkpoint = cpt;
                                    getProgress(p, cpt); // success p=1
                                }
                            });
                            if (res.statusCode === 200) {
                                itemSucc(doItem);
                            }
                        }
                    }
                    catch (error) {
                        itemFail(doItem, error);
                    }
                }
            });
        }
    };
    const getFails = () => {
        return suspends.filter(item => item.status === params_1.ETaskStatus.fail);
    };
    /**
     * add upload
     * @param {object[]} objects - List of objects to upload,for example [{name:'test/1.txt', path:'D://1.txt', size:1024}]
     * @param {string} objects[].name - object name
     * @param {string} objects[].filePath - Local file path,for example by windows : 'D://1.txt'
     * @param {number} objects[].size - object size (byte)
     * @param {object} [objects[].checkpoint] - You can pass in a checkpoint to continue transmitting an object
     * @param {Function} [objects[].getProgress] - (res: number, checkpoint?: any) The callback function obtains the checkpoint required for upload progress and breakpoint continuation
     * @returns {boolean} - After adding, an exception will be thrown when the new task is being executed
     */
    const add = (objects) => {
        if (waits.some(item => objects.some(obj => obj.name === item.name)) || doings.some(item => objects.some(obj => obj.name === item.name))) {
            throw new Error('The task is in progress. Please use dispose to release the task first');
        }
        objects.forEach(item => {
            const { name, filePath, size, getProgress, checkpoint } = item;
            waits.push({
                type: size < opt.splitSize ? params_1.EMUploadType.small : params_1.EMUploadType.big,
                name,
                filePath,
                size,
                status: params_1.ETaskStatus.wait,
                progress: 0,
                checkpoint,
                getProgress: (res) => {
                    if (getProgress) {
                        getProgress(res);
                    }
                }
            });
        });
        if (!_isDoing) {
            doUpload();
        }
        return true;
    };
    /**
     * Pause the upload of an object, Restore via reStart
     * @param {string} objectName - object name, Path without bucket name
    */
    const suspend = (objectName) => {
        let index = doings.findIndex(item => item.name === objectName);
        let obj;
        if (index > -1) {
            obj = doings[index];
            if (obj.status === params_1.ETaskStatus.doing && obj.type === params_1.EMUploadType.big) {
                that.cancel(); // cancel multi part upload
                doings.splice(index, 1); // remove doings
            }
            else
                throw new Error('Files smaller than splitsize cannot be uploaded temporarily');
        }
        else {
            index = waits.findIndex(item => item.name === objectName);
            obj = waits[index];
            waits.splice(index, 1);
        }
        if (index > -1 && obj) {
            obj.status = params_1.ETaskStatus.suspend;
            suspends.push(obj);
        }
        return true;
    };
    /**
     * Resume the previously suspended task. If the suspended task is not found, an exception will be thrown
     * @param {string} objectName - object name, Path without bucket name
    */
    const reStart = (objectName) => {
        const index = suspends.findIndex(item => item.name === objectName);
        if (index > -1) {
            const obj = suspends[index];
            obj.status = params_1.ETaskStatus.wait;
            obj.message = undefined; // reset error message
            suspends.splice(index, 1);
            waits.unshift(obj); // entries first
            if (!_isDoing)
                doUpload();
        }
        else
            throw new Error('object is not suspend');
        return true;
    };
    /**
     * delete task
     * Files smaller than splitsize cannot be deleted
     * @param {string} objectName - object name, Path without bucket name
     */
    const deleteItem = (objectName) => {
        let index = waits.findIndex(item => item.name === objectName);
        if (index > -1) {
            waits.splice(index, 1);
        }
        else {
            index = suspends.findIndex(item => item.name === objectName);
            if (index > -1) {
                suspends.splice(index, 1);
            }
            else {
                return stopDoing(objectName);
            }
        }
        return true;
    };
    // TODO 返回 成功和失败列表
    return {
        add,
        suspend,
        reStart,
        delete: deleteItem,
        dispose,
        getFails
    };
}
exports.multipleUpload = multipleUpload;
