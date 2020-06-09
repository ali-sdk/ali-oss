"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAgent = void 0;
const platform_1 = __importDefault(require("platform"));
const version_1 = __importDefault(require("../../browser/version"));
const checkUserAgent_1 = require("./checkUserAgent");
exports.getUserAgent = () => {
    const agent = (process && process.browser) ? 'js' : 'nodejs';
    const sdk = `aliyun-sdk-${agent}/${version_1.default.version}`;
    let plat = platform_1.default.description;
    if (!plat && process) {
        plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
    }
    return checkUserAgent_1.checkUserAgent(`${sdk} ${plat}`);
};
