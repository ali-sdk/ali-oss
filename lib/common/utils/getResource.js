"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResource = void 0;
const encoder_1 = require("./encoder");
function getResource(params, headerEncoding) {
    let resource = '/';
    if (params.bucket)
        resource += `${params.bucket}/`;
    if (params.object)
        resource += encoder_1.encoder(params.object, headerEncoding);
    return resource;
}
exports.getResource = getResource;
