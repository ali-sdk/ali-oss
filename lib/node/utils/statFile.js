"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statFile = void 0;
const fs_1 = __importDefault(require("fs"));
function statFile(filepath) {
    return new Promise((resolve, reject) => {
        fs_1.default.stat(filepath, (err, stats) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stats);
            }
        });
    });
}
exports.statFile = statFile;
