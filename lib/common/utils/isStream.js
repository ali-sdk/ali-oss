"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDuplex = exports.isWritable = exports.isReadable = void 0;
const stream_1 = require("stream");
function isStream(obj) {
    return obj instanceof stream_1.Stream;
}
function isReadable(obj) {
    return isStream(obj) && typeof obj._read === 'function' && typeof obj._readableState === 'object';
}
exports.isReadable = isReadable;
function isWritable(obj) {
    return isStream(obj) && typeof obj._write === 'function' && typeof obj._writableState === 'object';
}
exports.isWritable = isWritable;
function isDuplex(obj) {
    return isReadable(obj) && isWritable(obj);
}
exports.isDuplex = isDuplex;
