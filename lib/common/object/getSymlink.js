"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSymlink = void 0;
const objectName_1 = require("../utils/objectName");
const objectRequestParams_1 = require("../utils/objectRequestParams");
/**
 * getSymlink
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */
async function getSymlink(name, options = {}) {
    options.subres = Object.assign({ symlink: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    name = objectName_1.objectName(name);
    const params = objectRequestParams_1.objectRequestParams('GET', name, this.options.bucket, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    const target = result.res.headers['x-oss-symlink-target'];
    return {
        targetName: decodeURIComponent(target),
        res: result.res
    };
}
exports.getSymlink = getSymlink;
;
