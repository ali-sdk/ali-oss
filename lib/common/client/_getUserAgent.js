"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getUserAgent = void 0;
const platform_1 = __importDefault(require("platform"));
const version_1 = require("../../browser/version");
const _checkUserAgent_1 = require("./_checkUserAgent");
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
