"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueTask = void 0;
/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options - retry default 3 limit default5
 *
 */
function queueTask(argList, customFunc, options = { retry: 3, limit: 5 }) {
    const opts = Object.assign({}, options);
    const { limit, retry } = opts;
    if (limit > 10) {
        throw new Error('no more than 10 threads');
    }
    let retryCount = 0;
    const queueList = argList.map(i => () => {
        return new Promise((resolve, reject) => {
            customFunc(i)
                .then(r => resolve(r))
                .catch(err => reject(err));
        });
    });
    const errorList = [];
    const sucessList = [];
    const queueRun = () => {
        let status = true;
        if (queueList.length > 0) {
            const task = queueList.pop();
            while (status) {
                task()
                    .then(r => {
                    sucessList.push(r);
                })
                    // eslint-disable-next-line no-loop-func
                    .catch(err => {
                    if (retryCount < retry) {
                        retryCount += 1;
                        queueList.unshift(task);
                    }
                    else {
                        errorList.push(err);
                        status = false;
                    }
                });
            }
            queueRun();
        }
    };
    // limit customFun
    for (let i = 0; i < limit; i++) {
        // queueRun();
    }
    queueList[0]();
    return {
        sucessList,
        errorList
    };
}
exports.queueTask = queueTask;
