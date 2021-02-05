"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMultipartUpload = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
const convertMetaToHeaders_1 = require("../utils/convertMetaToHeaders");
const _objectRequestParams_1 = require("../client/_objectRequestParams");
async function initMultipartUpload(name, options = {}) {
    const opt = {};
    copy_to_1.default(options).to(opt);
    opt.headers = opt.headers || {};
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, opt.headers);
    opt.subres = 'uploads';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'POST', name, opt);
    params.mime = options.mime;
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
        bucket: result.data.Bucket,
        name: result.data.Key,
        uploadId: result.data.UploadId
    };
}
exports.initMultipartUpload = initMultipartUpload;
