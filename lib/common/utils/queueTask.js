"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueTask = void 0;
const isAsync_1 = require("./isAsync");
const isFunction_1 = require("./isFunction");
/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options -  limit default5
 */
function queueTask(argList, customFunc, options = { limit: 5 }) {
    const opts = Object.assign({}, options);
    const { limit } = opts;
    if (limit > 10) {
        throw new Error('no more than 10 threads');
    }
    const isBrowserEnv = process && process.browser;
    const errorList = [];
    const sucessList = [];
    const doing = [];
    const queueList = argList.map(i => () => {
        return new Promise((resolve, reject) => {
            // browser
            if (isBrowserEnv && isFunction_1.isFunction(customFunc)) {
                customFunc
                    .apply(this, i)
                    .then(r => resolve(r))
                    .catch(err => reject(err));
            }
            // node
            if (isAsync_1.isAsync(customFunc)) {
                customFunc
                    .apply(this, i)
                    .then(r => resolve(r))
                    .catch(err => reject(err));
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
                        .catch(e => errorList.push(e.toString()))
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
    // const result = await task();
    return task();
}
exports.queueTask = queueTask;
