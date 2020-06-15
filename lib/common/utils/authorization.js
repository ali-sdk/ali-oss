"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const signUtils_1 = require("./signUtils");
function authorization(method, resource, subres, headers, config) {
    const stringToSign = signUtils_1.buildCanonicalString(method.toUpperCase(), resource, {
        headers,
        parameters: subres
    });
    return `OSS ${config.accessKeyId}:${signUtils_1.computeSignature(config.accessKeySecret, stringToSign)}`;
}
exports.authorization = authorization;
