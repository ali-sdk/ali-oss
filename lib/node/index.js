"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const object_1 = __importDefault(require("./object"));
const node = {};
merge_descriptors_1.default(node, object_1.default);
exports.default = merge_descriptors_1.default({}, node);
