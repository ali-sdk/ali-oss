"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStream = void 0;
const _objectRequestParams_1 = require("../../common/client/_objectRequestParams");
async function getStream(name, options = {}) {
    options.subres = Object.assign({}, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    if (options.process) {
        options.subres = options.subres || {};
        options.subres['x-oss-process'] = options.process;
    }
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', name, options);
    params.customResponse = true;
    params.successStatuses = [200, 206, 304];
    const result = await this.request(params);
    return {
        stream: result.res,
        res: {
            status: result.status,
            headers: result.headers,
        },
    };
}
exports.getStream = getStream;
