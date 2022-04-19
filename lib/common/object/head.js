"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.head = void 0;
const checkEnv_1 = require("../utils/checkEnv");
/**
 * head
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
async function head(name, options = {}) {
    checkEnv_1.checkEnv('Because HeadObject has gzip enabled, head cannot get the file size correctly. If you need to get the file size, please use getObjectMeta');
    options.subres = Object.assign({}, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = this._objectRequestParams('HEAD', name, options);
    params.successStatuses = [200, 304];
    const result = await this.request(params);
    const data = {
        meta: null,
        res: result.res,
        status: result.status
    };
    if (result.status === 200) {
        Object.keys(result.headers).forEach(k => {
            if (k.indexOf('x-oss-meta-') === 0) {
                if (!data.meta) {
                    data.meta = {};
                }
                data.meta[k.substring(11)] = result.headers[k];
            }
        });
    }
    return data;
}
exports.head = head;
