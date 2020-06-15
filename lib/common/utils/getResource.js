"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResource = void 0;
function getResource(params) {
    let resource = '/';
    if (params.bucket)
        resource += `${params.bucket}/`;
    if (params.object)
        resource += params.object;
    return resource;
}
exports.getResource = getResource;
