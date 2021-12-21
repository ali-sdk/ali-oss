"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
const getBuffer = file => {
    // Some browsers do not support Blob.prototype.arrayBuffer, such as IE
    if (file.arrayBuffer)
        return file.arrayBuffer();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
        };
        reader.onerror = (e) => {
            reject(e);
        };
        reader.readAsArrayBuffer(file);
    });
};
async function _createStream(file, start, end) {
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        const _file = file.slice(start, end);
        const fileContent = await getBuffer(_file);
        return Buffer.from(fileContent);
    }
    else if (isBuffer_1.isBuffer(file)) {
        return file.subarray(start, end);
    }
    else {
        throw new Error('_createStream requires File/Blob/Buffer.');
    }
}
exports._createStream = _createStream;
