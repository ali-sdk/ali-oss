"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQuery = void 0;
const isObject_1 = require("./isObject");
function camel2Line(name) {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}
function formatQuery(query = {}) {
    const obj = {};
    if (isObject_1.isObject(query)) {
        Object.keys(query).forEach((key) => {
            obj[camel2Line(key)] = query[key];
        });
    }
    return obj;
}
exports.formatQuery = formatQuery;
