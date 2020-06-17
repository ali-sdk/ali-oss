"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._createStream = void 0;
const fs_1 = __importDefault(require("fs"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const isFile_1 = require("../../common/utils/isFile");
const webFileReadStream_1 = require("../../common/utils/webFileReadStream");
function _createStream(file, start, end) {
    if (is_type_of_1.default.readableStream(file)) {
        return file;
    }
    else if (isFile_1.isFile(file)) {
        return new webFileReadStream_1.WebFileReadStream(file.slice(start, end));
    }
    else if (is_type_of_1.default.string(file)) {
        return fs_1.default.createReadStream(file, {
            start,
            end: end - 1
        });
    }
    throw new Error('_createStream requires File/String.');
}
exports._createStream = _createStream;
