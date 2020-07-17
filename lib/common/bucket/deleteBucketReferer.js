"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucketReferer = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const putBucketReferer_1 = require("./putBucketReferer");
async function deleteBucketReferer(name, options) {
    checkBucketName_1.checkBucketName(name);
    return await putBucketReferer_1.putBucketReferer.call(this, name, true, null, options);
}
exports.deleteBucketReferer = deleteBucketReferer;
