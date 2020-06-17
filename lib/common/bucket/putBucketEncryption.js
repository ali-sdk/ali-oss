"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketEncryption = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */
async function putBucketEncryption(bucketName, options = {}) {
    options = options || {};
    checkBucketName_1.checkBucketName(bucketName);
    const params = this._bucketRequestParams('PUT', bucketName, 'encryption', options);
    params.successStatuses = [200];
    const paramXMLObj = {
        ServerSideEncryptionRule: {
            ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: options.SSEAlgorithm
            }
        }
    };
    if (options.KMSMasterKeyID !== undefined) {
        paramXMLObj.ServerSideEncryptionRule
            .ApplyServerSideEncryptionByDefault
            .KMSMasterKeyID = options.KMSMasterKeyID;
    }
    const paramXML = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true
    });
    params.mime = 'xml';
    params.content = paramXML;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res
    };
}
exports.putBucketEncryption = putBucketEncryption;
;
