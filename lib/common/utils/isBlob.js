"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlob = void 0;
function isBlob(blob) {
    return typeof Blob !== 'undefined' && blob instanceof Blob;
}
exports.isBlob = isBlob;
