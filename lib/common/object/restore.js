"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restore = void 0;
const _objectRequestParams_1 = require("../client/_objectRequestParams");
/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */
async function restore(name, options = {}) {
    options.subres = Object.assign({ restore: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'POST', name, options);
    params.successStatuses = [202];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.restore = restore;
