"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getObjectMeta = void 0;
const head_1 = require("../object/head");
/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
async function _getObjectMeta(bucket, name, options = {}) {
    const currentBucket = this.options.bucket;
    this.setBucket(bucket);
    try {
        const data = await head_1.head.call(this, name, options);
        this.setBucket(currentBucket);
        return data;
    }
    catch (error) {
        this.setBucket(currentBucket);
        throw error;
    }
}
exports._getObjectMeta = _getObjectMeta;
