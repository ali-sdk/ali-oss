"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._bucketRequestParams = void 0;
function _bucketRequestParams(method, bucket, subres, options) {
    return {
        method,
        bucket,
        subres,
        timeout: options && options.timeout,
        ctx: options && options.ctx
    };
}
exports._bucketRequestParams = _bucketRequestParams;
;
