"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPart = void 0;
const _createStream_1 = require("../client/_createStream");
const handleUploadPart_1 = require("../../common/multipart/handleUploadPart");
/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {File} file upload File, whole File
 * @param {Integer} start  part start bytes  e.g: 102400
 * @param {Integer} end  part end bytes  e.g: 204800
 * @param {Object} options
 */
async function uploadPart(name, uploadId, partNo, file, start, end, options = {}) {
    const data = {
        stream: await _createStream_1._createStream(file, start, end),
        size: end - start
    };
    return await handleUploadPart_1.handleUploadPart.call(this, name, uploadId, partNo, data, options);
}
exports.uploadPart = uploadPart;
