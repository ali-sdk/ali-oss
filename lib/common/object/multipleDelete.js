"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleDelete = void 0;
const params_1 = require("../../types/params");
/**
 * multiple delete
 * pageSize: 1000
 */
function multipleDelete(options) {
    const that = this;
    const opt = { syncNumber: 5, pageSize: 1000 };
    Object.assign(opt, options);
    const waits = []; // task list
    const suspends = []; // suspend or fail list
    const doings = []; // doing task
    const dispose = () => {
        waits.length = 0; // clear waits
        suspends.length = 0;
        // stop doings
        for (const item of doings) {
            stopDoing(item.name);
        }
        doings.length = 0;
    };
    const stopDoing = (objectName) => {
        const index = doings.findIndex(item => item.name === objectName);
        if (index === -1)
            return false;
        const obj = doings[index];
        obj.status = params_1.ETaskStatus.wait; // stop delete
        doings.splice(index, 1); // remove doings
        return true;
    };
    const itemSucc = item => {
        const index = doings.findIndex(doItem => doItem.name === item.name);
        if (index > -1)
            doings.splice(index, 1); // remove doing item
        doDelete(); // recursion
    };
    const itemFail = (item, error) => {
        const index = doings.findIndex(doItem => doItem.name === item.name);
        if (index > -1)
            doings.splice(index, 1); // remove doing item
        item.status = params_1.ETaskStatus.fail;
        item.message = error.message;
        suspends.push(item);
        doDelete(); // recursion
    };
    const doDelete = () => {
        if (waits.length === 0) {
            return;
        }
        const num = opt.syncNumber - doings.length;
        if (num === 0)
            return;
        const list = waits.splice(0, num);
        if (list.length > 0) {
            doings.push(...list);
            list.forEach(doItem => {
                const { status } = doItem;
                if (status === params_1.ETaskStatus.wait) {
                    doItem.status = params_1.ETaskStatus.doing;
                    exeDelete(doItem, doItem.name, undefined); // async doing
                }
            });
        }
    };
    const exeDelete = async (item, prefix, nextToken) => {
        const { getProgress, status } = item;
        if (status !== params_1.ETaskStatus.doing)
            return; // suspend
        try {
            const para = {
                prefix,
                'max-keys': 1000,
                'continuation-token': nextToken
            };
            const res = await that.listV2(para);
            const { prefixes, objects, nextContinuationToken } = res;
            // console.log('prefixes', prefixes, 'objects', objects, para);
            if (prefixes) {
                for (const pre of prefixes) {
                    // eslint-disable-next-line no-await-in-loop
                    await exeDelete(item, pre, undefined);
                }
            }
            if (nextContinuationToken) {
                await exeDelete(item, item.name, nextContinuationToken);
            }
            else {
                const dres = await that.deleteMulti(objects.map(f => f.name));
                const succ = dres.deleted.length === objects.length; // TODO fails
                getProgress(succ ? 1 : 0);
                itemSucc(item);
            }
        }
        catch (error) {
            itemFail(item, error);
        }
    };
    /**
     * add delete
     * @objects [{name:'test/1.txt', path:'D://1.txt', size:1024}]
     */
    const add = (objects) => {
        if (waits.some(item => objects.some(obj => obj.name === item.name)) || doings.some(item => objects.some(obj => obj.name === item.name))) {
            throw new Error('The task is in progress. Please use dispose to release the task first');
        }
        objects.forEach(item => {
            const { name, getProgress } = item;
            waits.push({
                name,
                status: params_1.ETaskStatus.wait,
                progress: 0,
                getProgress: (res) => {
                    getProgress(res);
                }
            });
        });
        doDelete();
        return true;
    };
    const suspend = (objectName) => {
        let index = doings.findIndex(item => item.name === objectName);
        let obj;
        if (index > -1) {
            obj = doings[index];
            doings.splice(index, 1); // remove doings
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
    const reStart = (objectName) => {
        const index = suspends.findIndex(item => item.name === objectName);
        if (index > -1) {
            const obj = suspends[index];
            obj.status = params_1.ETaskStatus.wait;
            obj.message = undefined; // reset error message
            suspends.splice(index, 1);
            waits.unshift(obj); // entries first
            return true;
        }
        else
            return false;
    };
    /**
     * delete task
     * small file is not delete
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
    return {
        add,
        suspend,
        reStart,
        delete: deleteItem,
        dispose
    };
}
exports.multipleDelete = multipleDelete;
