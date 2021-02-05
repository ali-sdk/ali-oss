"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const buffer_1 = require("buffer");
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
async function _createStream(file, start, end) {
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        const _file = file.slice(start, end);
        const fileContent = await _file.arrayBuffer();
        return buffer_1.Buffer.from(fileContent);
    }
    else if (isBuffer_1.isBuffer(file)) {
        return file.subarray(start, end);
    }
    else {
        throw new Error('_createStream requires File/Blob/Buffer.');
    }
}
exports._createStream = _createStream;
