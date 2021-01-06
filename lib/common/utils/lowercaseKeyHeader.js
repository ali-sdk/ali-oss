"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowercaseKeyHeader = void 0;
const isObject_1 = require("./isObject");
function lowercaseKeyHeader(headers) {
    const lowercaseHeader = {};
    if (isObject_1.isObject(headers)) {
        Object.keys(headers).forEach(key => {
            lowercaseHeader[key.toLowerCase()] = headers[key];
        });
    }
    return lowercaseHeader;
}
exports.lowercaseKeyHeader = lowercaseKeyHeader;
