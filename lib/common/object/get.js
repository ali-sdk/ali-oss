"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const fs_1 = __importDefault(require("fs"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const deleteFileSafe_1 = require("../utils/deleteFileSafe");
const isObject_1 = require("../utils/isObject");
const crc64_1 = require("../utils/crc64");
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
async function get(name, file, options = {}) {
    let writeStream = null;
    let needDestroy = false;
    if (is_type_of_1.default.writableStream(file)) {
        writeStream = file;
    }
    else if (is_type_of_1.default.string(file)) {
        writeStream = fs_1.default.createWriteStream(file);
        needDestroy = true;
    }
    else if (isObject_1.isObject(file)) {
        options = file;
    }
    const isBrowserEnv = process && process.browser;
    const responseCacheControl = options.responseCacheControl === null ? '' : 'no-cache';
    const defaultSubresOptions = isBrowserEnv && responseCacheControl ? { 'response-cache-control': responseCacheControl } : {};
    options.subres = Object.assign(defaultSubresOptions, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    if (options.process) {
        options.subres['x-oss-process'] = options.process;
    }
    let result;
    try {
        const params = this._objectRequestParams('GET', name, options);
        params.writeStream = writeStream;
        params.successStatuses = [200, 206, 304];
        result = await this.request(params);
        // buffer
        if (options.crc64 && result.data) {
            if (isBrowserEnv) {
                if (typeof options.crc64 === 'function' &&
                    options.crc64(result.data) !== result.headers['x-oss-hash-crc64ecma']) {
                    throw new Error('crc64 check fail');
                }
            }
            else if (!crc64_1.checkCrc64(result.data, result.headers['x-oss-hash-crc64ecma'])) {
                throw new Error('crc64 check fail');
            }
        }
        // stream
        if (options.crc64 && writeStream) {
            console.log('check stream');
            crc64_1.checkCrc64File(writeStream.path, (err, d) => {
                if (err)
                    throw new Error(err.toString());
                if (d !== result.headers['x-oss-hash-crc64ecma']) {
                    throw new Error('crc64 check fail');
                }
            });
        }
        if (needDestroy) {
            writeStream.destroy();
        }
    }
    catch (err) {
        if (needDestroy) {
            writeStream.destroy();
            // should delete the exists file before throw error
            await deleteFileSafe_1.deleteFileSafe(file);
        }
        throw err;
    }
    return {
        res: result.res,
        content: result.data
    };
}
exports.get = get;
