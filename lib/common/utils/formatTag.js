"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTag = void 0;
const isObject_1 = require("./isObject");
function formatTag(obj) {
    if (obj.Tagging !== undefined) {
        obj = obj.Tagging.TagSet.Tag;
    }
    else if (obj.TagSet !== undefined) {
        obj = obj.TagSet.Tag;
    }
    else if (obj.Tag !== undefined) {
        obj = obj.Tag;
    }
    obj = obj && isObject_1.isObject(obj) ? [obj] : obj || [];
    const tag = {};
    obj.forEach(item => {
        tag[item.Key] = item.Value;
    });
    return tag;
}
exports.formatTag = formatTag;
