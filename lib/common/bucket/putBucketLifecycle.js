"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketLifecycle = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const isArray_1 = require("../utils/isArray");
const deepCopy_1 = require("../utils/deepCopy");
const isObject_1 = require("../utils/isObject");
const obj2xml_1 = require("../utils/obj2xml");
const checkObjectTag_1 = require("../utils/checkObjectTag");
const getStrBytesCount_1 = require("../utils/getStrBytesCount");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function putBucketLifecycle(name, rules, options = {}) {
    checkBucketName_1.checkBucketName(name);
    if (!isArray_1.isArray(rules)) {
        throw new Error('rules must be Array');
    }
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', name, 'lifecycle', options);
    const Rule = [];
    const paramXMLObj = {
        LifecycleConfiguration: {
            Rule
        }
    };
    rules.forEach((_) => {
        defaultDaysAndDate2Expiration(_); // todo delete, 兼容旧版本
        checkRule(_);
        const rule = deepCopy_1.deepCopy(_);
        if (rule.id) {
            rule.ID = rule.id;
            delete rule.id;
        }
        Rule.push(rule);
    });
    const paramXML = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true,
        firstUpperCase: true
    });
    params.content = paramXML;
    params.mime = 'xml';
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.putBucketLifecycle = putBucketLifecycle;
// todo delete, 兼容旧版本
function defaultDaysAndDate2Expiration(obj) {
    if (obj.days) {
        obj.expiration = {
            days: obj.days
        };
    }
    if (obj.date) {
        obj.expiration = {
            createdBeforeDate: obj.date
        };
    }
}
function checkDaysAndDate(obj, key) {
    const { days, createdBeforeDate } = obj;
    if (!days && !createdBeforeDate) {
        throw new Error(`${key} must includes days or createdBeforeDate`);
    }
    else if (days && !/^[1-9][0-9]*$/.test(days)) {
        throw new Error('days must be a positive integer');
    }
    else if (createdBeforeDate && !/\d{4}-\d{2}-\d{2}T00:00:00.000Z/.test(createdBeforeDate)) {
        throw new Error('createdBeforeDate must be date and conform to iso8601 format');
    }
}
function handleCheckTag(tag) {
    if (!isArray_1.isArray(tag) && !isObject_1.isObject(tag)) {
        throw new Error('tag must be Object or Array');
    }
    tag = isObject_1.isObject(tag) ? [tag] : tag;
    const tagObj = {};
    const tagClone = deepCopy_1.deepCopy(tag);
    tagClone.forEach((v) => {
        tagObj[v.key] = v.value;
    });
    checkObjectTag_1.checkObjectTag(tagObj);
}
function checkRule(rule) {
    if (rule.id && getStrBytesCount_1.getStrBytesCount(rule.id) > 255)
        throw new Error('ID is composed of 255 bytes at most');
    if (rule.prefix === undefined)
        throw new Error('Rule must includes prefix');
    if (!['Enabled', 'Disabled'].includes(rule.status))
        throw new Error('Status must be  Enabled or Disabled');
    if (rule.transition) {
        if (!['IA', 'Archive'].includes(rule.transition.storageClass))
            throw new Error('StorageClass must be  IA or Archive');
        checkDaysAndDate(rule.transition, 'Transition');
    }
    if (rule.expiration) {
        if (!rule.expiration.expiredObjectDeleteMarker) {
            checkDaysAndDate(rule.expiration, 'Expiration');
        }
        else if (rule.expiration.days || rule.expiration.createdBeforeDate) {
            throw new Error('expiredObjectDeleteMarker cannot be used with days or createdBeforeDate');
        }
    }
    if (rule.abortMultipartUpload) {
        checkDaysAndDate(rule.abortMultipartUpload, 'AbortMultipartUpload');
    }
    if (!rule.expiration && !rule.abortMultipartUpload && !rule.transition && !rule.noncurrentVersionTransition) {
        throw new Error('Rule must includes expiration or abortMultipartUpload or transition or noncurrentVersionTransition');
    }
    if (rule.tag) {
        if (rule.abortMultipartUpload) {
            throw new Error('Tag cannot be used with abortMultipartUpload');
        }
        handleCheckTag(rule.tag);
    }
}
