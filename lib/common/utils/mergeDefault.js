"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDefault = void 0;
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
function mergeDefault(source, mod) {
    merge_descriptors_1.default(source, mod.default ? mod.default : mod);
}
exports.mergeDefault = mergeDefault;
