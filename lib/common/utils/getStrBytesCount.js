"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStrBytesCount = void 0;
function getStrBytesCount(str) {
    let bytesCount = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i);
        if (/^[\u00-\uff]$/.test(c)) {
            bytesCount += 1;
        }
        else {
            bytesCount += 2;
        }
    }
    return bytesCount;
}
exports.getStrBytesCount = getStrBytesCount;
