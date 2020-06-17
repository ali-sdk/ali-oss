"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXML = void 0;
const xml2js_1 = __importDefault(require("xml2js"));
/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 */
function parseXML(str) {
    return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(str)) {
            str = str.toString();
        }
        xml2js_1.default.parseString(str, {
            explicitRoot: false,
            explicitArray: false
        }, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
exports.parseXML = parseXML;
;
