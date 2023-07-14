"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obj2xml = void 0;
const formatObjKey_1 = require("./formatObjKey");
function type(params) {
    return Object.prototype.toString
        .call(params)
        .replace(/(.*? |])/g, '')
        .toLowerCase();
}
function obj2xml(obj, options) {
    let s = '';
    if (options && options.headers) {
        s = '<?xml version="1.0" encoding="UTF-8"?>\n';
    }
    if (options && options.firstUpperCase) {
        obj = formatObjKey_1.formatObjKey(obj, 'firstUpperCase');
    }
    if (type(obj) === 'object') {
        Object.keys(obj).forEach(key => {
            // filter undefined or null
            if (type(obj[key]) !== 'undefined' && type(obj[key]) !== 'null') {
                if (type(obj[key]) === 'string' || type(obj[key]) === 'number') {
                    s += `<${key}>${obj[key]}</${key}>`;
                }
                else if (type(obj[key]) === 'object') {
                    s += `<${key}>${obj2xml(obj[key])}</${key}>`;
                }
                else if (type(obj[key]) === 'array') {
                    s += obj[key].map(keyChild => `<${key}>${obj2xml(keyChild)}</${key}>`).join('');
                }
                else {
                    s += `<${key}>${obj[key].toString()}</${key}>`;
                }
            }
        });
    }
    else {
        s += obj.toString();
    }
    return s;
}
exports.obj2xml = obj2xml;
