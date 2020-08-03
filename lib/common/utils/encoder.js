"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encoder = void 0;
function encoder(str, encoding = 'utf-8') {
    if (encoding === 'utf-8')
        return str;
    return Buffer.from(str).toString('latin1');
}
exports.encoder = encoder;
