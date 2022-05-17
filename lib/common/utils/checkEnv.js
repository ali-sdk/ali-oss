"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEnv = void 0;
function checkEnv(msg) {
    if (process.browser) {
        console.warn(msg);
    }
}
exports.checkEnv = checkEnv;
