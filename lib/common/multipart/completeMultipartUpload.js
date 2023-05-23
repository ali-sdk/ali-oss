"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeMultipartUpload = void 0;
const encodeCallback_1 = require("../utils/encodeCallback");
const obj2xml_1 = require("../utils/obj2xml");
const deepCopy_1 = require("../utils/deepCopy");
const isBuffer_1 = require("../utils/isBuffer");
const omit_1 = require("../utils/omit");
/**
 * Complete a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Array} parts the uploaded parts, each in the structure:
 *        {Integer} number partNo
 *        {String} etag  part etag  uploadPartCopy result.res.header.etag
 * @param {Object} options
 *         {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *         {String} options.callback.url  the OSS sends a callback request to this URL
 *         {String} options.callback.host  The host header value for initiating callback requests
 *         {String} options.callback.body  The value of the request body when a callback is initiated
 *         {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *         {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                   customValue = {
 *                     key1: 'value1',
 *                     key2: 'value2'
 *                   }
 */
async function completeMultipartUpload(name, uploadId, parts, options = {}) {
    const completeParts = parts
        .concat()
        .sort((a, b) => a.number - b.number)
        .filter((item, index, arr) => !index || item.number !== arr[index - 1].number);
    const xmlParamObj = {
        CompleteMultipartUpload: {
            Part: completeParts.map((_) => ({
                PartNumber: _.number,
                ETag: _.etag,
            })),
        },
    };
    const opt = deepCopy_1.deepCopyWith(options, (_) => {
        if (isBuffer_1.isBuffer(_))
            return null;
        return undefined;
    });
    opt.headers = omit_1.omit(opt.headers, ['x-oss-server-side-encryption', 'x-oss-storage-class']);
    if (opt.headers)
        delete opt.headers['x-oss-server-side-encryption'];
    opt.subres = { uploadId };
    const params = this._objectRequestParams('POST', name, opt);
    encodeCallback_1.encodeCallback(params, opt);
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(xmlParamObj, { headers: true });
    if (!(params.headers && params.headers['x-oss-callback'])) {
        params.xmlResponse = true;
    }
    params.successStatuses = [200];
    const result = await this.request(params);
    this.options.multipartRunning = false;
    const ret = {
        res: result.res,
        bucket: params.bucket,
        name,
        etag: result.res.headers.etag,
    };
    if (params.headers && params.headers['x-oss-callback']) {
        ret.data = JSON.parse(result.data.toString());
    }
    return ret;
}
exports.completeMultipartUpload = completeMultipartUpload;
