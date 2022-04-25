"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSize = void 0;
const is_type_of_1 = __importDefault(require("is-type-of"));
const isFile_1 = require("../../common/utils/isFile");
const isBuffer_1 = require("../../common/utils/isBuffer");
const statFile_1 = require("./statFile");
async function getFileSize(file) {
    console.log(JSON.stringify(is_type_of_1.default), 'issssss');
    if (isBuffer_1.isBuffer(file)) {
        return file.length;
    }
    else if (isFile_1.isFile(file)) {
        return file.size;
    }
    if (is_type_of_1.default.string(file)) {
        const stat = await statFile_1.statFile(file);
        return stat.size;
    }
    throw new Error('getFileSize requires Buffer/File/String.');
}
exports.getFileSize = getFileSize;
