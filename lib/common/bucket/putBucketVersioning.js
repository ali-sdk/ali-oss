"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketVersioning = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const checkBucketName_1 = require("../utils/checkBucketName");
/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */
async function putBucketVersioning(name, status, options = {}) {
    checkBucketName_1.checkBucketName(name);
    if (!['Enabled', 'Suspended'].includes(status)) {
        throw new Error('status must be Enabled or Suspended');
    }
    const params = this._bucketRequestParams('PUT', name, 'versioning', options);
    const paramXMLObj = {
        VersioningConfiguration: {
            Status: status
        }
    };
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true
    });
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.putBucketVersioning = putBucketVersioning;
