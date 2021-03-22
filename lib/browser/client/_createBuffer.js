"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createBuffer = void 0;
const buffer_1 = require("buffer");
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
function getBuffer(file) {
    // Some browsers do not support Blob.prototype.arrayBuffer, such as IE
    if (file.arrayBuffer)
        return file.arrayBuffer();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function (e) {
            reject(e);
        };
        reader.readAsArrayBuffer(file);
    });
}
async function _createBuffer(file, start, end) {
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        const _file = file.slice(start, end);
        const fileContent = await getBuffer(_file);
        return buffer_1.Buffer.from(fileContent);
    }
    else if (isBuffer_1.isBuffer(file)) {
        return file.subarray(start, end);
    }
    else {
        throw new Error('_createBuffer requires File/Blob/Buffer.');
    }
}
exports._createBuffer = _createBuffer;
