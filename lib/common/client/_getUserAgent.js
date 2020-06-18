"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getUserAgent = void 0;
const platform_1 = __importDefault(require("platform"));
const _checkUserAgent_1 = require("./_checkUserAgent");
const version_1 = require("../../browser/version");
/*
 * Get User-Agent for browser & node.js
 * @example
 *   aliyun-sdk-nodejs/4.1.2 Node.js 5.3.0 on Darwin 64-bit
 *   aliyun-sdk-js/4.1.2 Safari 9.0 on Apple iPhone(iOS 9.2.1)
 *   aliyun-sdk-js/4.1.2 Chrome 43.0.2357.134 32-bit on Windows Server 2008 R2 / 7 64-bit
 */
function _getUserAgent() {
    const agent = (process && process.browser) ? 'js' : 'nodejs';
    const sdk = `aliyun-sdk-${agent}/${version_1.version}`;
    let plat = platform_1.default.description;
    if (!plat && process) {
        plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
    }
    return _checkUserAgent_1._checkUserAgent(`${sdk} ${plat}`);
}
exports._getUserAgent = _getUserAgent;
;
