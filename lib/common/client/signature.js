"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signature = void 0;
const signUtils_1 = require("../utils/signUtils");
/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
function signature(stringToSign) {
    return signUtils_1.computeSignature(this.options.accessKeySecret, stringToSign);
}
exports.signature = signature;
;
