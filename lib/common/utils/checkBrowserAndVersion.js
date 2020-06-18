"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBrowserAndVersion = void 0;
const bowser_1 = __importDefault(require("bowser"));
/*
 * Check Browser And Version
 * @param {String} [name] browser name: like IE, Chrome, Firefox
 * @param {String} [version] browser major version: like 10(IE 10.x), 55(Chrome 55.x), 50(Firefox 50.x)
 * @return {Bool} true or false
 * @api private
 */
function checkBrowserAndVersion(name, version) {
    return ((bowser_1.default.name === name) && (bowser_1.default.version.split('.')[0] === version));
}
exports.checkBrowserAndVersion = checkBrowserAndVersion;
;
