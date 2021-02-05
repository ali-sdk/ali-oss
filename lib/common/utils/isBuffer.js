"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBuffer = void 0;
const buffer_1 = require("buffer");
function isBuffer(obj) {
    return buffer_1.Buffer.isBuffer(obj);
}
exports.isBuffer = isBuffer;
