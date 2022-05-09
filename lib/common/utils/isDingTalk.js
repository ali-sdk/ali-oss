"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDingTalk = void 0;
const mime = require('mime');
const path = require('path');
function isDingTalk(params) {
    if (process.browser &&
        !mime.getType(params.mime || path.extname(params.object || '')) &&
        window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')) {
        return true;
    }
    return false;
}
exports.isDingTalk = isDingTalk;
