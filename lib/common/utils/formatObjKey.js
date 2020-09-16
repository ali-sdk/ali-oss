"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatObjKey = void 0;
function formatObjKey(obj, type, options) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    let o;
    if (Array.isArray(obj)) {
        o = [];
        for (let i = 0; i < obj.length; i++) {
            o.push(formatObjKey(obj[i], type, options));
        }
    }
    else {
        o = {};
        Object.keys(obj).forEach((key) => {
            o[handelFormat(key, type, options)] = formatObjKey(obj[key], type, options);
        });
    }
    return o;
}
exports.formatObjKey = formatObjKey;
function handelFormat(key, type, options) {
    var _a;
    if (options && ((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.includes(key)))
        return key;
    if (type === 'firstUpperCase') {
        key = key.replace(/^./, (_) => _.toUpperCase());
    }
    else if (type === 'firstLowerCase') {
        key = key.replace(/^./, (_) => _.toLowerCase());
    }
    return key;
}
