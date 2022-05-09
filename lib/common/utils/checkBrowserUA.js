"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBrowserUA = void 0;
const mime = require('mime');
const path = require('path');
function checkBrowserUA(params) {
    if (process.browser &&
        !mime.getType(params.mime || path.extname(params.object || '')) &&
        window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')) {
        return true;
    }
    return false;
}
exports.checkBrowserUA = checkBrowserUA;
