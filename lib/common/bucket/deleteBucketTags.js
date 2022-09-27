"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketTags = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isArray_1 = require("../utils/isArray");
const isObject_1 = require("../utils/isObject");
/**
 * deleteBucketTags
 * @param {String} name - bucket name
 * @param {Array} tags - tags
 * @param {Object} options
 */
async function deleteBucketTags() {
    const name = arguments[0];
    checkBucketName_1.checkBucketName(name);
    let options = {};
    let subres = 'tagging';
    if (arguments.length === 2) {
        if (isArray_1.isArray(arguments[1])) {
            subres = { tagging: arguments[1].toString() };
        }
        if (isObject_1.isObject(arguments[1])) {
            options = arguments[1];
        }
    }
    if (arguments.length === 3) {
        if (!isArray_1.isArray(arguments[1])) {
            throw new Error('tags must be Array');
        }
        subres = { tagging: arguments[1].toString() };
        options = arguments[2];
    }
    const params = this._bucketRequestParams('DELETE', name, subres, options);
    params.successStatuses = [204];
    console.log('params', params);
    // params.successStatuses = [204];
    // const result = await this.request(params);
    // return {
    //   status: result.status,
    //   res: result.res,
    // };
}
exports.deleteBucketTags = deleteBucketTags;
