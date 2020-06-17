"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectMeta = void 0;
const objectName_1 = require("../utils/objectName");
const objectRequestParams_1 = require("../utils/objectRequestParams");
/**
 * getObjectMeta
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
async function getObjectMeta(name, options = {}) {
    name = objectName_1.objectName(name);
    options.subres = Object.assign({ objectMeta: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = objectRequestParams_1.objectRequestParams('HEAD', name, this.options.bucket, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res
    };
}
exports.getObjectMeta = getObjectMeta;
;
