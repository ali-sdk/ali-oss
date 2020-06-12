"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFile = void 0;
exports.isFile = (obj) => {
    return typeof (File) !== 'undefined' && obj instanceof File;
};
