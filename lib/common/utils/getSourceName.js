"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceName = void 0;
const checkBucketName_1 = require("./checkBucketName");
const objectName_1 = require("./objectName");
function getSourceName(sourceName, bucketName, configBucket) {
    if (typeof bucketName === 'string') {
        sourceName = objectName_1.objectName(sourceName);
    }
    else if (sourceName[0] !== '/') {
        bucketName = configBucket;
    }
    else {
        bucketName = sourceName.replace(/\/(.+?)(\/.*)/, '$1');
        sourceName = sourceName.replace(/(\/.+?\/)(.*)/, '$2');
    }
    checkBucketName_1.checkBucketName(bucketName, false);
    sourceName = encodeURI(sourceName);
    sourceName = `/${bucketName}/${sourceName}`;
    return sourceName;
}
exports.getSourceName = getSourceName;
