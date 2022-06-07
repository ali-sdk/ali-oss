"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omit = void 0;
function omit(originalObject, keysToOmit) {
    const cloneObject = Object.assign({}, originalObject);
    for (const path of keysToOmit) {
        delete cloneObject[path];
    }
    return cloneObject;
}
exports.omit = omit;
