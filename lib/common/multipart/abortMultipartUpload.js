"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abortMultipartUpload = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
const _objectRequestParams_1 = require("../client/_objectRequestParams");
const _stop_1 = require("../client/_stop");
/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
async function abortMultipartUpload(name, uploadId, options = {}) {
    _stop_1._stop.call(this);
    const opt = {};
    copy_to_1.default(options).to(opt);
    opt.subres = { uploadId };
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'DELETE', name, opt);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.abortMultipartUpload = abortMultipartUpload;
