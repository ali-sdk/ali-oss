"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateObjectUrl = void 0;
const objectName_1 = require("../utils/objectName");
const escapeName_1 = require("../utils/escapeName");
const url_1 = __importDefault(require("url"));
/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */
function generateObjectUrl(name, baseUrl) {
    if (!baseUrl) {
        baseUrl = this.options.endpoint.format();
        const copyUrl = url_1.default.parse(baseUrl);
        const { bucket } = this.options;
        copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
        copyUrl.host = `${bucket}.${copyUrl.host}`;
        baseUrl = copyUrl.format();
    }
    else if (baseUrl[baseUrl.length - 1] !== '/') {
        baseUrl += '/';
    }
    return baseUrl + escapeName_1.escapeName(objectName_1.objectName(name));
}
exports.generateObjectUrl = generateObjectUrl;
;
