"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getResource = void 0;
function _getResource(params) {
    let resource = '/';
    if (params.bucket)
        resource += `${params.bucket}/`;
    if (params.object)
        resource += params.object;
    return resource;
}
exports._getResource = _getResource;
;
