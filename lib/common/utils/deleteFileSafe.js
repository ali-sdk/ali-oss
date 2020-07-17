"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileSafe = void 0;
const fs_1 = __importDefault(require("fs"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('ali-oss');
function deleteFileSafe(filepath) {
    return new Promise(resolve => {
        fs_1.default.exists(filepath, exists => {
            if (!exists) {
                resolve();
            }
            else {
                fs_1.default.unlink(filepath, err => {
                    if (err) {
                        debug('unlink %j error: %s', filepath, err);
                    }
                    resolve();
                });
            }
        });
    });
}
exports.deleteFileSafe = deleteFileSafe;
