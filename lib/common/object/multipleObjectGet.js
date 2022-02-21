"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleObjectGet = void 0;
async function multipleObjectGet(objects, options) {
    const that = this;
    const defaultPath = process.env.HOME + '/Downloads';
    options = Object.assign({ parallel: 3, path: defaultPath }, options);
    const err = await task();
    if (err && err.length > 0) {
        return err;
    }
    else
        return 'ok';
    function task() {
        return new Promise(resolve => {
            const jobErr = [];
            const doing = [];
            const jobs = objects.map(_ => {
                return () => {
                    return that.get(_, `${options.path}/${_}`);
                };
            });
            for (let i = 0; i < options.parallel && objects && objects.length && !that.isCancel(); i++) {
                continueFn(jobs);
            }
            function continueFn(queue) {
                if (!queue || !queue.length || that.isCancel()) {
                    return;
                }
                const item = queue.pop();
                doing.push(item);
                item()
                    .then(_res => {
                    continueFn(queue);
                })
                    .catch(_err => {
                    queue.length = 0;
                    jobErr.push(_err);
                    resolve(jobErr);
                })
                    .then(() => {
                    doing.pop();
                    if (!doing.length)
                        resolve();
                });
            }
        });
    }
}
exports.multipleObjectGet = multipleObjectGet;
