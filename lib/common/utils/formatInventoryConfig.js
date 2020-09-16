"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInventoryConfig = void 0;
const dataFix_1 = require("../utils/dataFix");
const isObject_1 = require("../utils/isObject");
const isArray_1 = require("../utils/isArray");
const formatObjKey_1 = require("../utils/formatObjKey");
function formatInventoryConfig(inventoryConfig, toArray = false) {
    if (toArray && isObject_1.isObject(inventoryConfig))
        inventoryConfig = [inventoryConfig];
    if (isArray_1.isArray(inventoryConfig)) {
        inventoryConfig = inventoryConfig.map(formatFn);
    }
    else {
        inventoryConfig = formatFn(inventoryConfig);
    }
    return inventoryConfig;
}
exports.formatInventoryConfig = formatInventoryConfig;
function formatFn(_) {
    dataFix_1.dataFix(_, { bool: ['IsEnabled'] }, conf => {
        var _a;
        // prefix
        conf.prefix = conf.Filter.Prefix;
        delete conf.Filter;
        // OSSBucketDestination
        conf.OSSBucketDestination = conf.Destination.OSSBucketDestination;
        // OSSBucketDestination.rolename
        conf.OSSBucketDestination.rolename = conf.OSSBucketDestination.RoleArn.replace(/.*\//, '');
        delete conf.OSSBucketDestination.RoleArn;
        // OSSBucketDestination.bucket
        conf.OSSBucketDestination.bucket = conf.OSSBucketDestination.Bucket.replace(/.*:::/, '');
        delete conf.OSSBucketDestination.Bucket;
        delete conf.Destination;
        // frequency
        conf.frequency = conf.Schedule.Frequency;
        delete conf.Schedule.Frequency;
        // optionalFields
        if (isObject_1.isObject((_a = conf.optionalFields) === null || _a === void 0 ? void 0 : _a.Field))
            conf.optionalFields.Field = [conf.optionalFields.Field];
    });
    // firstLowerCase
    _ = formatObjKey_1.formatObjKey(_, 'firstLowerCase', { exclude: ['OSSBucketDestination', 'SSE-OSS', 'SSE-KMS'] });
    return _;
}
