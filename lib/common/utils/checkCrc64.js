"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCrc64Stream = exports.checkCrc64 = void 0;
const crc64_1 = require("../../crc64");
exports.checkCrc64 = (content, oss_crc64) => {
    if (crc64_1.crc64(content) === oss_crc64)
        return true;
    return false;
};
exports.checkCrc64Stream = (stream, callback) => {
    crc64_1.crc64File(stream, callback);
};
