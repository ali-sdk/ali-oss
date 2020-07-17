"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteObjectTagging = void 0;
const objectName_1 = require("../utils/objectName");
/**
 * deleteObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 */
async function deleteObjectTagging(name, options = {}) {
    options.subres = Object.assign({ tagging: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    name = objectName_1.objectName(name);
    const params = this._objectRequestParams('DELETE', name, options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.deleteObjectTagging = deleteObjectTagging;
