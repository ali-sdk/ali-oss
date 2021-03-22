"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSize = void 0;
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
const statFile_1 = require("./statFile");
const isString_1 = require("../../common/utils/isString");
async function getFileSize(file) {
    if (isBuffer_1.isBuffer(file)) {
        return file.length;
    }
    else if (isFile_1.isFile(file)) {
        return file.size;
    }
    else if (isString_1.isString(file)) {
        const stat = await statFile_1.statFile(file);
        return stat.size;
    }
    throw new Error('getFileSize requires Buffer/File/String.');
}
exports.getFileSize = getFileSize;
