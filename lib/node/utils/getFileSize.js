"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSize = void 0;
const is_type_of_1 = __importDefault(require("is-type-of"));
const isFile_1 = require("../../common/utils/isFile");
const statFile_1 = require("./statFile");
async function getFileSize(file) {
    if (is_type_of_1.default.buffer(file)) {
        return file.length;
    }
    else if (isFile_1.isFile(file)) {
        return file.size;
    }
    if (is_type_of_1.default.string(file)) {
        const stat = await statFile_1.statFile(file);
        return stat.size;
    }
    throw new Error('_getFileSize requires Buffer/File/String.');
}
exports.getFileSize = getFileSize;
