"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getObjectMeta = void 0;
const client_1 = require("../client");
const head_1 = require("../object/head");
/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
async function _getObjectMeta(bucket, name, options = {}) {
    const currentBucket = this.options.bucket;
    client_1.setBucket.call(this, bucket);
    try {
        const data = await head_1.head.call(this, name, options);
        client_1.setBucket.call(this, currentBucket);
        return data;
    }
    catch (error) {
        client_1.setBucket.call(this, currentBucket);
        throw error;
    }
}
exports._getObjectMeta = _getObjectMeta;
