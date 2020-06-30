"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._unSupportBrowserTip = void 0;
const platform_1 = __importDefault(require("platform"));
function _unSupportBrowserTip() {
    const { name, version } = platform_1.default;
    if (name && name.toLowerCase && name.toLowerCase() === 'ie' && version.split('.')[0] < 10) {
        console.warn('ali-oss does not support the current browser');
    }
}
exports._unSupportBrowserTip = _unSupportBrowserTip;
