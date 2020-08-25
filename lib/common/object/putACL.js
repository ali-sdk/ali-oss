"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putACL = void 0;
const objectName_1 = require("../utils/objectName");
/*
 * Set object's ACL
 * @param {String} name the object key
 * @param {String} acl the object ACL
 * @param {Object} options
 */
async function putACL(name, acl, options = {}) {
    options.subres = Object.assign({ acl: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    options.headers = options.headers || {};
    options.headers['x-oss-object-acl'] = acl;
    name = objectName_1.objectName(name);
    const params = this._objectRequestParams('PUT', name, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.putACL = putACL;
