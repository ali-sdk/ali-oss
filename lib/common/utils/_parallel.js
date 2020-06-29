"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._parallel = void 0;
async function _parallel(todo, parallel, fn, sourceData) {
    // upload in parallel
    const jobErr = [];
    let jobs = [];
    for (let i = 0; i < todo.length; i = i + parallel) {
        if (this.isCancel()) {
            break;
        }
        jobs = todo.slice(i, i + parallel).map(_ => fn(_, sourceData));
        try {
            /* eslint no-await-in-loop: [0] */
            await Promise.all(jobs);
        }
        catch (err) {
            jobErr.push(err);
            break;
        }
    }
    return jobErr;
}
exports._parallel = _parallel;
;
