"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteObject = void 0;
const objectRequestParams_1 = require("../utils/objectRequestParams");
/**
 * delete
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
async function deleteObject(name, options = {}) {
    options.subres = Object.assign({}, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = objectRequestParams_1.objectRequestParams('DELETE', name, this.options.bucket, options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.deleteObject = deleteObject;
;
