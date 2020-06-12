"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBucketNameTest = void 0;
const isArray_1 = require("./isArray");
exports.checkBucketNameTest = (name, createBucket) => {
    const bucketRegex = createBucket ? /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/ : /^[a-z0-9_][a-z0-9-_]{1,61}[a-z0-9_]$/;
    if (!bucketRegex.test(name)) {
        throw new Error('The bucket must be conform to the specifications');
    }
};
let res = isArray_1.isArray([1, 2, 3]);
console.log(res, 'is array');
res = isArray_1.isArray('');
console.log(res, 'is array');
