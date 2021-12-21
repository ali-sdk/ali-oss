"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restore = void 0;
const obj2xml_1 = require("../utils/obj2xml");
/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options {type : Archive or ColdArchive}
 * @returns {{res}}
 */
async function restore(name, options) {
    options = options || {};
    if (!options.type) {
        options.type = 'Archive';
    }
    options.subres = Object.assign({ restore: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = this._objectRequestParams('POST', name, options);
    if (options.type === 'ColdArchive') {
        const paramsXMLObj = {
            RestoreRequest: {
                Days: options.Days ? options.Days : 2,
                JobParameters: {
                    Tier: options.JobParameters ? options.JobParameters : 'Standard'
                }
            }
        };
        params.content = obj2xml_1.obj2xml(paramsXMLObj, {
            headers: true
        });
        params.mime = 'xml';
    }
    params.successStatuses = [202];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.restore = restore;
