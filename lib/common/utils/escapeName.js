"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeName = void 0;
const utility_1 = __importDefault(require("utility"));
const _defaultConfig = {
    reg: /%2F/g,
    str: '/'
};
function escapeName(name, config = _defaultConfig) {
    const { reg, str } = config;
    return utility_1.default.encodeURIComponent(name).replace(reg, str);
}
exports.escapeName = escapeName;
