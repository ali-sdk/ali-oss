"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePostSignature = void 0;
const buffer_1 = require("buffer");
const policy2Str_1 = require("../utils/policy2Str");
const signUtils_1 = require("../utils/signUtils");
const isObject_1 = require("../utils/isObject");
/**
 * @param {Object or JSON} policy specifies the validity of the fields in the request.
 * @return {Object} params
 *         {String} params.OSSAccessKeyId
 *         {String} params.Signature
 *         {String} params.policy JSON text encoded with UTF-8 and Base64.
 */
function calculatePostSignature(policy) {
    if (!isObject_1.isObject(policy) && typeof policy !== 'string') {
        throw new Error('policy must be JSON string or Object');
    }
    if (!isObject_1.isObject(policy)) {
        try {
            JSON.stringify(JSON.parse(policy));
        }
        catch (error) {
            throw new Error('policy must be JSON string or Object');
        }
    }
    policy = buffer_1.Buffer.from(policy2Str_1.policy2Str(policy), 'utf8').toString('base64');
    const Signature = signUtils_1.computeSignature(this.options.accessKeySecret, policy);
    const query = {
        OSSAccessKeyId: this.options.accessKeyId,
        Signature,
        policy,
    };
    return query;
}
exports.calculatePostSignature = calculatePostSignature;
