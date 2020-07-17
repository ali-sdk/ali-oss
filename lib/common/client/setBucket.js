"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBucket = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
function setBucket(name) {
    checkBucketName_1.checkBucketName(name);
    this.options.bucket = name;
    return this;
}
exports.setBucket = setBucket;
