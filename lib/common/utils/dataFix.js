"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataFix = void 0;
const isObject_1 = require("./isObject");
const TRUE = ['true', 'TRUE', '1', 1];
const FALSE = ['false', 'FALSE', '0', 0];
function dataFix(o, conf, finalKill) {
    if (!isObject_1.isObject(o))
        return;
    const { remove = [], rename = {}, camel = [], bool = [], lowerFirst = false, } = conf;
    // 删除不需要的数据
    remove.forEach(v => delete o[v]);
    // 重命名
    Object.entries(rename).forEach(v => {
        if (!o[v[0]])
            return;
        if (o[v[1]])
            return;
        o[v[1]] = o[v[0]];
        delete o[v[0]];
    });
    // 驼峰化
    camel.forEach(v => {
        if (!o[v])
            return;
        const afterKey = v
            .replace(/^(.)/, $0 => $0.toLowerCase())
            .replace(/-(\w)/g, (_, $1) => $1.toUpperCase());
        if (o[afterKey])
            return;
        o[afterKey] = o[v];
        // todo 暂时兼容以前数据，不做删除
        // delete o[v];
    });
    // 转换值为布尔值
    bool.forEach(v => {
        o[v] = fixBool(o[v]);
    });
    // finalKill
    if (typeof finalKill === 'function') {
        finalKill(o);
    }
    // 首字母转小写
    fixLowerFirst(o, lowerFirst);
    return dataFix;
}
exports.dataFix = dataFix;
function fixBool(value) {
    if (!value)
        return false;
    if (TRUE.includes(value))
        return true;
    return FALSE.includes(value) ? false : value;
}
function fixLowerFirst(o, lowerFirst) {
    if (lowerFirst) {
        Object.keys(o).forEach(key => {
            const lowerK = key.replace(/^\w/, match => match.toLowerCase());
            if (typeof o[lowerK] === 'undefined') {
                o[lowerK] = o[key];
                delete o[key];
            }
        });
    }
}
