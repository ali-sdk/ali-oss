"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBrowserEnv = void 0;
function checkBrowserEnv(msg) {
    if (process.browser) {
        console.warn(msg);
    }
}
exports.checkBrowserEnv = checkBrowserEnv;
