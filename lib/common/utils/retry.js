"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
function retry(func, retryMax, config = {}) {
    let retryNum = 0;
    const { retryDelay = 500, errorHandler = () => true } = config;
    const funcR = (...arg) => {
        return new Promise((resolve, reject) => {
            func(...arg)
                .then(result => {
                retryNum = 0;
                resolve(result);
            })
                .catch(err => {
                if (retryNum < retryMax && errorHandler(err)) {
                    retryNum++;
                    setTimeout(() => {
                        resolve(funcR(...arg));
                    }, retryDelay);
                }
                else {
                    retryNum = 0;
                    reject(err);
                }
            });
        });
    };
    return funcR;
}
exports.retry = retry;
