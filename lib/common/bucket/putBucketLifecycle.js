/* eslint-disable no-use-before-define */
const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');
const { isArray } = require('../utils/isArray');
const { deepCopy } = require('../utils/deepCopy');
const { isObject } = require('../utils/isObject');
const { obj2xml } = require('../utils/obj2xml');
const { checkObjectTag } = require('../utils/checkObjectTag');
const { getStrBytesCount } = require('../utils/getStrBytesCount');

const proto = exports;

proto.putBucketLifecycle = async function putBucketLifecycle(name, rules, options) {
  _checkBucketName(name);

  if (!isArray(rules)) {
    throw new Error('rules must be Array');
  }

  const params = this._bucketRequestParams('PUT', name, 'lifecycle', options);
  const Rule = [];
  const paramXMLObj = {
    LifecycleConfiguration: {
      Rule
    }
  };

  rules.forEach(_ => {
    defaultDaysAndDate2Expiration(_); // todo delete, 兼容旧版本
    checkRule(_);
    if (_.id) {
      _.ID = _.id;
      delete _.id;
    }
    Rule.push(_);
  });

  const paramXML = obj2xml(paramXMLObj, {
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
};

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
  } else if (days && (isArray(days) || !/^[1-9][0-9]*$/.test(days))) {
    throw new Error('days must be a positive integer');
  } else if (createdBeforeDate && !/\d{4}-\d{2}-\d{2}T00:00:00.000Z/.test(createdBeforeDate)) {
    throw new Error('createdBeforeDate must be date and conform to iso8601 format');
  }
}

function checkNoncurrentDays(obj, key) {
  const { noncurrentDays } = obj;
  if (!noncurrentDays) {
    throw new Error(`${key} must includes noncurrentDays`);
  } else if (noncurrentDays && (isArray(noncurrentDays) || !/^[1-9][0-9]*$/.test(noncurrentDays))) {
    throw new Error('noncurrentDays must be a positive integer');
  }
}

function handleCheckTag(tag) {
  if (!isArray(tag) && !isObject(tag)) {
    throw new Error('tag must be Object or Array');
  }
  tag = isObject(tag) ? [tag] : tag;
  const tagObj = {};
  const tagClone = deepCopy(tag);
  tagClone.forEach(v => {
    tagObj[v.key] = v.value;
  });

  checkObjectTag(tagObj);
}

function checkStorageClass(storageClass) {
  if (!['IA', 'Archive', 'ColdArchive', 'DeepColdArchive'].includes(storageClass))
    throw new Error(`StorageClass must be IA or Archive or ColdArchive or DeepColdArchive`);
}

function checkRule(rule) {
  if (rule.id && getStrBytesCount(rule.id) > 255) throw new Error('ID is composed of 255 bytes at most');

  if (rule.prefix === undefined) throw new Error('Rule must includes prefix');

  if (!['Enabled', 'Disabled'].includes(rule.status)) throw new Error('Status must be Enabled or Disabled');

  if (
    !rule.expiration &&
    !rule.noncurrentVersionExpiration &&
    !rule.abortMultipartUpload &&
    !rule.transition &&
    !rule.noncurrentVersionTransition
  ) {
    throw new Error(
      'Rule must includes expiration or noncurrentVersionExpiration or abortMultipartUpload or transition or noncurrentVersionTransition'
    );
  }

  if (rule.transition) {
    checkStorageClass(rule.transition.storageClass);
    checkDaysAndDate(rule.transition, 'Transition');
  }

  if (rule.expiration) {
    if (!rule.expiration.expiredObjectDeleteMarker) {
      checkDaysAndDate(rule.expiration, 'Expiration');
    } else if (rule.expiration.days || rule.expiration.createdBeforeDate) {
      throw new Error('expiredObjectDeleteMarker cannot be used with days or createdBeforeDate');
    }
  }

  if (rule.abortMultipartUpload) {
    checkDaysAndDate(rule.abortMultipartUpload, 'AbortMultipartUpload');
  }

  if (rule.noncurrentVersionTransition) {
    checkStorageClass(rule.noncurrentVersionTransition.storageClass);
    checkNoncurrentDays(rule.noncurrentVersionTransition, 'NoncurrentVersionTransition');
  }

  if (rule.noncurrentVersionExpiration) {
    checkNoncurrentDays(rule.noncurrentVersionExpiration, 'NoncurrentVersionExpiration');
  }

  if (rule.tag) {
    if (rule.abortMultipartUpload) {
      throw new Error('Tag cannot be used with abortMultipartUpload');
    }
    handleCheckTag(rule.tag);
  }
}
