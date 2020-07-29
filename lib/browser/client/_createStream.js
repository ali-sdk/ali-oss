"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const stream_1 = require("stream");
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
const webFileReadStream_1 = require("../../common/utils/webFileReadStream");
const isBuffer_1 = require("../../common/utils/isBuffer");
function _createStream(file, start, end) {
    if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        return new webFileReadStream_1.WebFileReadStream(file.slice(start, end));
    }
    else if (isBuffer_1.isBuffer(file)) {
        // we can't use Readable.from() since it is only support in Node v10
        const iterable = file.subarray(start, end);
        return new stream_1.Readable({
            read() {
                this.push(iterable);
                this.push(null);
            }
        });
    }
    throw new Error('_createStream requires File/Blob/Buffer.');
}
exports._createStream = _createStream;
