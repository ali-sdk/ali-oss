"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSize = void 0;
const is_type_of_1 = __importDefault(require("is-type-of"));
const isBlob_1 = require("../../common/utils/isBlob");
const isFile_1 = require("../../common/utils/isFile");
async function getFileSize(file) {
    if (is_type_of_1.default.buffer(file)) {
        return file.length;
    }
    else if (isBlob_1.isBlob(file) || isFile_1.isFile(file)) {
        return file.size;
    }
    throw new Error('_getFileSize requires Buffer/File/Blob.');
}
exports.getFileSize = getFileSize;
