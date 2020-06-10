"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = void 0;
exports.isArray = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Array]';
};
