"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectUrl = void 0;
const objectName_1 = require("../utils/objectName");
const escapeName_1 = require("../utils/escapeName");
/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint`.
 * @return {String} object url
 */
function getObjectUrl(name, baseUrl) {
    if (!baseUrl) {
        baseUrl = this.options.endpoint.format();
    }
    else if (baseUrl[baseUrl.length - 1] !== '/') {
        baseUrl += '/';
    }
    return baseUrl + escapeName_1.escapeName(objectName_1.objectName(name));
}
exports.getObjectUrl = getObjectUrl;
;
