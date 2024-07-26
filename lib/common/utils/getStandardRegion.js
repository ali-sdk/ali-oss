"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardRegion = void 0;
function getStandardRegion(str) {
    return str.replace(/^oss-/g, '');
}
exports.getStandardRegion = getStandardRegion;
