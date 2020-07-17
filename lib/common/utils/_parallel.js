"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._parallel = void 0;
function _parallel(todo, num, fn, sourceData) {
    const that = this;
    return new Promise(res => {
        const jobErr = [];
        const doing = [];
        const jobs = todo.map(_ => {
            return () => {
                return fn(_, sourceData);
            };
        });
        for (let i = 0; i < num && todo && todo.length && !that.isCancel(); i++) {
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
                res(jobErr);
            })
                .finally(() => {
                doing.pop();
                if (!doing.length)
                    res();
            });
        }
    });
}
exports._parallel = _parallel;
