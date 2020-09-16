"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const crypto_1 = __importDefault(require("crypto"));
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
async function _createStream(file, start, end, useMd5 = false) {
    const fileInfo = {};
    let fileContent;
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        const _file = file.slice(start, end);
        fileContent = await _file.arrayBuffer();
        fileInfo.stream = Buffer.from(fileContent);
    }
    else if (isBuffer_1.isBuffer(file)) {
        fileInfo.stream = file.subarray(start, end);
        fileContent = fileInfo.stream;
    }
    else {
        throw new Error('_createStream requires File/Blob/Buffer.');
    }
    fileInfo.md5 =
        useMd5 && crypto_1.default.createHash('md5').update(fileContent).digest('base64');
    return fileInfo;
}
exports._createStream = _createStream;
