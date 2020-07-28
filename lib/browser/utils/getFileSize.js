"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSize = void 0;
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
async function getFileSize(file) {
    if (isBuffer_1.isBuffer(file)) {
        return file.length;
    }
    else if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        return file.size;
    }
    throw new Error('getFileSize requires Buffer/File/Blob.');
}
exports.getFileSize = getFileSize;
