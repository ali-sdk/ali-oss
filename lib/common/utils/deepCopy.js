"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepCopy = void 0;
exports.deepCopy = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    const copy = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
        copy[key] = exports.deepCopy(obj[key]);
    });
    return copy;
};
