"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const webFileReadStream_1 = require("../../common/utils/webFileReadStream");
function _createStream(file, start, end) {
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        return new webFileReadStream_1.WebFileReadStream(file.slice(start, end));
    }
    throw new Error('_createStream requires File/Blob.');
}
exports._createStream = _createStream;
