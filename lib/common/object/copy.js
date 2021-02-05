"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copy = void 0;
const getSourceName_1 = require("../utils/getSourceName");
const convertMetaToHeaders_1 = require("../utils/convertMetaToHeaders");
const _objectRequestParams_1 = require("../client/_objectRequestParams");
const REPLACE_HEDERS = [
    'content-type',
    'content-encoding',
    'content-language',
    'content-disposition',
    'cache-control',
    'expires',
];
async function copy(name, sourceName, bucketName, options) {
    if (typeof bucketName === 'object') {
        options = bucketName; // 兼容旧版本，旧版本第三个参数为options
    }
    options = options || {};
    options.headers = options.headers || {};
    Object.keys(options.headers).forEach(key => {
        options.headers[`x-oss-copy-source-${key.toLowerCase()}`] =
            options.headers[key];
    });
    if (options.meta || Object.keys(options.headers).find(_ => REPLACE_HEDERS.includes(_.toLowerCase()))) {
        options.headers['x-oss-metadata-directive'] = 'REPLACE';
    }
    convertMetaToHeaders_1.convertMetaToHeaders(options.meta, options.headers);
    sourceName = getSourceName_1.getSourceName(sourceName, bucketName, this.options.bucket);
    if (options.versionId) {
        sourceName = `${sourceName}?versionId=${options.versionId}`;
    }
    options.headers['x-oss-copy-source'] = sourceName;
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'PUT', name, options);
    params.xmlResponse = true;
    params.successStatuses = [200, 304];
    const result = await this.request(params);
    let { data } = result;
    if (data) {
        data = {
            etag: data.ETag,
            lastModified: data.LastModified,
        };
    }
    return {
        data,
        res: result.res,
    };
}
exports.copy = copy;
