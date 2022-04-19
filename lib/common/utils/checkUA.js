"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUA = void 0;
const mime_1 = __importDefault(require("mime"));
const path_1 = __importDefault(require("path"));
function checkUA(params) {
    if (process.browser &&
        !mime_1.default.getType(params.mime || path_1.default.extname(params.object || '')) &&
        window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')) {
        return true;
    }
    return false;
}
exports.checkUA = checkUA;
