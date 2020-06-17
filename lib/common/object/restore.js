"use strict";
/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.restore = void 0;
async function restore(name, options) {
    options = options || {};
    options.subres = Object.assign({ restore: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = this._objectRequestParams('POST', name, options);
    params.successStatuses = [202];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.restore = restore;
;
