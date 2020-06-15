"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMetaToHeaders = void 0;
function convertMetaToHeaders(meta, headers) {
    if (!meta)
        return;
    Object.keys(meta).forEach((k) => {
        headers[`x-oss-meta-${k}`] = meta[k];
    });
}
exports.convertMetaToHeaders = convertMetaToHeaders;
