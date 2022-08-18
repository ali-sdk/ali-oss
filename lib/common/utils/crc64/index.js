"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCrc64File = exports.checkCrc64Stream = exports.checkCrc64 = void 0;
// @ts-ignore
const { check, check_stream } = require('./crc64.js');
const CRC64 = require('crc64-ecma182');
// @ts-ignore
exports.checkCrc64 = (content, oss_crc64) => CRC64.toUInt64String(check(content)) === oss_crc64;
exports.checkCrc64Stream = function (p, callback) {
    check_stream(p, (err, data) => {
        callback(err, CRC64.toUInt64String(data));
    });
};
exports.checkCrc64File = function (p, callback) {
    return CRC64.crc64File(p, true, callback);
};
