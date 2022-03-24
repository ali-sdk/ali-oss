"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueTask = void 0;
const isAsync_1 = require("./isAsync");
/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options - retry default 3 limit default5
 *
 */
async function queueTask(argList, customFunc, options = { retry: 3, limit: 5 }) {
    const opts = Object.assign({}, options);
    const { limit, retry } = opts;
    if (limit > 10) {
        throw new Error('no more than 10 threads');
    }
    let retryCount = 0;
    const errorList = [];
    const sucessList = [];
    const doing = [];
    const queueList = argList.map(i => () => {
        return new Promise(resolve => {
            if (isAsync_1.isAsync(customFunc)) {
                resolve(customFunc.apply(this, i));
            }
            else {
                resolve(customFunc(...i));
            }
        });
    });
    function task() {
        return new Promise(resolve => {
            const queueRun = () => {
                if (!queueList || !queueList.length) {
                    return;
                }
                if (queueList.length > 0) {
                    const job = queueList.pop();
                    doing.push(job);
                    job()
                        .then(r => {
                        sucessList.push(r);
                        queueRun();
                    })
                        .catch(e => {
                        if (retryCount < retry) {
                            retryCount += 1;
                            queueList.unshift(job);
                        }
                        else {
                            errorList.push(e);
                        }
                    })
                        .then(() => {
                        doing.pop();
                        if (!doing.length) {
                            resolve({
                                sucessList,
                                errorList
                            });
                        }
                    });
                }
            };
            // limit customFun
            for (let i = 0; i < limit; i++) {
                queueRun();
            }
        });
    }
    const result = await task();
    return result;
}
exports.queueTask = queueTask;
