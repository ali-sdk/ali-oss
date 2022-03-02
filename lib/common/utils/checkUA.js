"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUA = void 0;
const mime = require('mime');
const path = require('path');
function checkUA(params) {
    if (process.browser &&
        !mime.getType(params.mime || path.extname(params.object || '')) &&
        window.navigator.userAgent.toLowerCase().includes('AliApp(DingTalk')) {
        return true;
    }
    return false;
}
exports.checkUA = checkUA;
