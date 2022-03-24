"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAsync = void 0;
function isAsync(func) {
    return func.constructor.name === 'AsyncFunction';
}
exports.isAsync = isAsync;
