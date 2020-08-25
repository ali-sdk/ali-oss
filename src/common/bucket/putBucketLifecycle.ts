import { checkBucketName } from '../utils/checkBucketName';
import { isArray } from '../utils/isArray';
import { deepCopy } from '../utils/deepCopy';
import { isObject } from '../utils/isObject';
import { obj2xml } from '../utils/obj2xml';
import { checkObjectTag } from '../utils/checkObjectTag';
import { getStrBytesCount } from '../utils/getStrBytesCount';
import { RequestOptions, LifecycleRule } from '../../types/params';

export async function putBucketLifecycle(this: any, name: string, rules: LifecycleRule[], options: RequestOptions = {}) {
  checkBucketName(name);

  if (!isArray(rules)) {
    throw new Error('rules must be Array');
  }

  const params = this._bucketRequestParams('PUT', name, 'lifecycle', options);
  const Rule: any[] = [];
  const paramXMLObj = {
    LifecycleConfiguration: {
      Rule
    }
  };

  rules.forEach((_) => {
    defaultDaysAndDate2Expiration(_); // todo delete, 兼容旧版本
    checkRule(_);

    const rule: any = deepCopy(_);
    if (rule.id) {
      rule.ID = rule.id;
      delete rule.id;
    }
    Rule.push(rule);
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
}

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
  } else if (days && !/^[1-9][0-9]*$/.test(days)) {
    throw new Error('days must be a positive integer');
  } else if (createdBeforeDate && !/\d{4}-\d{2}-\d{2}T00:00:00.000Z/.test(createdBeforeDate)) {
    throw new Error('createdBeforeDate must be date and conform to iso8601 format');
  }
}

function handleCheckTag(tag) {
  if (!isArray(tag) && !isObject(tag)) {
    throw new Error('tag must be Object or Array');
  }
  tag = isObject(tag) ? [tag] : tag;
  const tagObj = {};
  const tagClone = deepCopy(tag);
  tagClone.forEach((v) => {
    tagObj[v.key] = v.value;
  });

  checkObjectTag(tagObj);
}

function checkRule(rule) {
  if (rule.id && getStrBytesCount(rule.id) > 255) throw new Error('ID is composed of 255 bytes at most');

  if (rule.prefix === undefined) throw new Error('Rule must includes prefix');

  if (!['Enabled', 'Disabled'].includes(rule.status)) throw new Error('Status must be  Enabled or Disabled');

  if (rule.transition) {
    if (!['IA', 'Archive'].includes(rule.transition.storageClass)) throw new Error('StorageClass must be  IA or Archive');
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

