"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserAgent = void 0;
exports.checkUserAgent = ua => {
    const userAgent = ua.replace(/\u03b1/, 'alpha').replace(/\u03b2/, 'beta');
    return userAgent;
};
