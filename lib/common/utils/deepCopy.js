"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepCopyWith = exports.deepCopy = void 0;
const isBuffer_1 = require("./isBuffer");
exports.deepCopy = obj => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (isBuffer_1.isBuffer(obj)) {
        return obj.slice();
    }
    const copy = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach(key => {
        copy[key] = exports.deepCopy(obj[key]);
    });
    return copy;
};
exports.deepCopyWith = (obj, customizer) => {
    function deepCopyWithHelper(value, innerKey, innerObject) {
        const result = customizer(value, innerKey, innerObject);
        if (result !== undefined)
            return result;
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (isBuffer_1.isBuffer(value)) {
            return value.slice();
        }
        const copy = Array.isArray(value) ? [] : {};
        Object.keys(value).forEach(k => {
            copy[k] = deepCopyWithHelper(value[k], k, value);
        });
        return copy;
    }
    if (customizer) {
        return deepCopyWithHelper(obj, '', null);
    }
    else {
        return exports.deepCopy(obj);
    }
};
