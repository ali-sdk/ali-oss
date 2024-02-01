"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeString = void 0;
const toString_1 = __importDefault(require("lodash/toString"));
function encodeString(str) {
    const tempStr = toString_1.default(str);
    return encodeURIComponent(tempStr).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}
exports.encodeString = encodeString;
