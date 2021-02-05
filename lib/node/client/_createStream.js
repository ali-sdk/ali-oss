"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
const isFile_1 = require("../../common/utils/isFile");
const webFileReadStream_1 = require("../../common/utils/webFileReadStream");
const isBuffer_1 = require("../../common/utils/isBuffer");
const isStream_1 = require("../../common/utils/isStream");
const isString_1 = require("../../common/utils/isString");
async function _createStream(file, start, end) {
    if (isStream_1.isReadable(file)) {
        return file;
    }
    else if (isFile_1.isFile(file)) {
        return new webFileReadStream_1.WebFileReadStream(file.slice(start, end));
    }
    else if (isBuffer_1.isBuffer(file)) {
        const iterable = file.subarray(start, end);
        // we can't use Readable.from() since it is only support in Node v10
        return new stream_1.Readable({
            read() {
                this.push(iterable);
                this.push(null);
            },
        });
    }
    else if (isString_1.isString(file)) {
        return fs_1.default.createReadStream(file, {
            start,
            end: end - 1
        });
    }
    throw new Error('_createStream requires File/String.');
}
exports._createStream = _createStream;
