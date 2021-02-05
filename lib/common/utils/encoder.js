"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encoder = void 0;
const buffer_1 = require("buffer");
function encoder(str, encoding = 'utf-8') {
    if (encoding === 'utf-8')
        return str;
    return buffer_1.Buffer.from(str).toString('latin1');
}
exports.encoder = encoder;
