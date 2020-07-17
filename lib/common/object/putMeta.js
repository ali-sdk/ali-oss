"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putMeta = void 0;
const copy_1 = require("./copy");
async function putMeta(name, meta, options = {}) {
    const copyResult = await copy_1.copy.call(this, name, name, {
        meta: meta || {},
        timeout: options && options.timeout,
        ctx: options && options.ctx
    });
    return copyResult;
}
exports.putMeta = putMeta;
