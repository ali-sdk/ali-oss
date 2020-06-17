"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listParts = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
/**
 * List the done uploadPart parts
 * @param {String} name object name
 * @param {String} uploadId multipart upload id
 * @param {Object} query
 * {Number} query.max-parts The maximum part number in the response of the OSS. Default value: 1000
 * {Number} query.part-number-marker Starting position of a specific list.
 * {String} query.encoding-type Specify the encoding of the returned content and the encoding type.
 * @param {Object} options
 * @return {Object} result
 */
async function listParts(name, uploadId, query, options = {}) {
    const opt = {};
    copy_to_1.default(options).to(opt);
    opt.subres = {
        uploadId
    };
    const params = this._objectRequestParams('GET', name, opt);
    params.query = query;
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
        uploadId: result.data.UploadId,
        bucket: result.data.Bucket,
        name: result.data.Key,
        partNumberMarker: result.data.PartNumberMarker,
        nextPartNumberMarker: result.data.NextPartNumberMarker,
        maxParts: result.data.MaxParts,
        isTruncated: result.data.IsTruncated,
        parts: result.data.Part || []
    };
}
exports.listParts = listParts;
