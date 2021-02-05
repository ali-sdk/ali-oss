"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putSymlink = void 0;
const objectName_1 = require("../utils/objectName");
const convertMetaToHeaders_1 = require("../utils/convertMetaToHeaders");
const escapeName_1 = require("../utils/escapeName");
const _objectRequestParams_1 = require("../client/_objectRequestParams");
/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */
async function putSymlink(name, targetName, options = {}) {
    options.headers = options.headers || {};
    targetName = escapeName_1.escapeName(objectName_1.objectName(targetName));
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    options.headers['x-oss-symlink-target'] = targetName;
    options.subres = Object.assign({ symlink: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    if (options.storageClass) {
        options.headers['x-oss-storage-class'] = options.storageClass;
    }
    name = objectName_1.objectName(name);
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'PUT', name, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.putSymlink = putSymlink;
