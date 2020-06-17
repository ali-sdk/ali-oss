"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAsyncFetch = void 0;
const formatObjKey_1 = require("../utils/formatObjKey");
/*
 * getAsyncFetch
 * @param {String} asyncFetch taskId
 * @param {Object} options
 */
async function getAsyncFetch(taskId, options = {}) {
    options.subres = Object.assign({ asyncFetch: '' }, options.subres);
    options.headers = options.headers || {};
    const params = this._objectRequestParams('GET', '', options);
    params.headers['x-oss-task-id'] = taskId;
    params.successStatuses = [200];
    params.xmlResponse = true;
    const result = await this.request(params);
    const taskInfo = formatObjKey_1.formatObjKey(result.data.TaskInfo, 'firstLowerCase');
    return {
        res: result.res,
        status: result.status,
        state: result.data.State,
        taskInfo
    };
}
exports.getAsyncFetch = getAsyncFetch;
