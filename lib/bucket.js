'use strict';

const assert = require('assert');

var proto = exports;

/**
 * Bucket opertaions
 */

proto.listBuckets = function* listBuckets(query, options) {
  // prefix, marker, max-keys
  var result = yield this.request({
    method: 'GET',
    query: query,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  });

  if (result.status === 200) {
    var data = yield this.parseXML(result.data);
    var buckets = data.Buckets || null;
    if (buckets) {
      if (buckets.Bucket) {
        buckets = buckets.Bucket;
      }
      if (!isArray(buckets)) {
        buckets = [buckets];
      }
      buckets = buckets.map(function (item) {
        return {
          name: item.Name,
          region: item.Location,
          creationDate: item.CreationDate,
          storageClass: item.StorageClass
        };
      });
    }
    return {
      buckets: buckets,
      owner: {
        id: data.Owner.ID,
        displayName: data.Owner.DisplayName,
      },
      isTruncated: data.IsTruncated === 'true',
      nextMarker: data.NextMarker || null,
      res: result.res
    };
  }

  throw yield this.requestError(result);
};

proto.useBucket = function useBucket(bucket) {
  this.options.bucket = bucket;
  return this;
};

proto.putBucket = function* putBucket(bucket, options) {
  var params = this._bucketRequestParams('PUT', bucket, '', options);
  if (options) {
    if (options.acl) {
      params.headers = params.header || {};
      params.headers['x-oss-acl'] = options.acl;
    }
    if (options.storageClass) {
      params.mime = 'xml';
      params.content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<CreateBucketConfiguration><StorageClass>' + options.storageClass +
          '</StorageClass></CreateBucketConfiguration>';
    }
  }
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    bucket: result.headers.location && result.headers.location.substring(1) || null,
    res: result.res
  };
};

proto.deleteBucket = function* deleteBucket(bucket, options) {
  var params = this._bucketRequestParams('DELETE', bucket, '', options);
  var result = yield this.request(params);
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res
    };
  }
  throw yield this.requestError(result);
};

// acl

proto.putBucketACL = function* putBucketACL(bucket, acl, options) {
  var params = this._bucketRequestParams('PUT', bucket, 'acl', options);
  params.headers = {
    'x-oss-acl': acl
  };
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    bucket: result.headers.location && result.headers.location.substring(1) || null,
    res: result.res
  };
};

proto.getBucketACL = function* getBucketACL(bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'acl', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName,
    },
    res: result.res
  };
};

// logging

proto.putBucketLogging = function* putBucketLogging(bucket, targetBucket, targetPrefix, options) {
  var params = this._bucketRequestParams('PUT', bucket, 'logging', options);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<BucketLoggingStatus>\n';
  if (targetBucket) {
    xml = xml + '<LoggingEnabled>\n<TargetBucket>' + targetBucket + '</TargetBucket>\n';
    if (targetPrefix) {
      xml += '<TargetPrefix>' + targetPrefix + '</TargetPrefix>\n';
    }
    xml += '</LoggingEnabled>\n'
  }
  xml += '</BucketLoggingStatus>';
  
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketLogging = function* getBucketLogging(bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'logging', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  var enable = result.data.LoggingEnabled;
  return {
    enable: !!enable,
    targetPrefix: enable && enable.TargetPrefix || null,
    targetBucket: enable && enable.TargetBucket || null,
    res: result.res,
  };
};

proto.deleteBucketLogging = function* deleteBucketLogging(bucket, options) {
  var params = this._bucketRequestParams('DELETE', bucket, 'logging', options);
  params.successStatuses = [204, 200];
  var result = yield this.request(params);
  return {
    res: result.res,
  };
};

// website

proto.putBucketWebsite = function* putBucketWebsite(bucket, config, options) {
  // config: index, [error]
  var params = this._bucketRequestParams('PUT', bucket, 'website', options);
  config = config || {};
  config.index = config.index || 'index.html';
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<WebsiteConfiguration>\n' +
    ' <IndexDocument><Suffix>' + config.index + '</Suffix></IndexDocument>\n';
  if (config.error) {
    xml += '<ErrorDocument><Key>' + config.error + '</Key></ErrorDocument>\n';
  }
  xml += '</WebsiteConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield* this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketWebsite = function* getBucketWebsite(bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'website', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  return {
    index: result.data.IndexDocument.Suffix,
    error: result.data.ErrorDocument && result.data.ErrorDocument.Key || null,
    res: result.res
  };
};

proto.deleteBucketWebsite = function* deleteBucketWebsite(bucket, options) {
  var params = this._bucketRequestParams('DELETE', bucket, 'website', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

// lifecycle

proto.putBucketLifecycle = function* putBucketLifecycle(bucket, rules, options) {
  // rules: [rule, ...]
  // rule: [id], prefix, status, expiration, [days or date]
  // status: 'Enabled' or 'Disabled'
  var params = this._bucketRequestParams('PUT', bucket, 'lifecycle', options);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<LifecycleConfiguration>\n';
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var expiration = rule.days ?
      '<Days>' + rule.days + '</Days>'
      :
      '<Date>' + rule.date + '</Date>';
    var id = rule.id ? '<ID>' + rule.id + '</ID>\n' : '';
    xml += '  <Rule>\n' + id +
      '    <Prefix>' + rule.prefix + '</Prefix>\n' +
      '    <Status>' + rule.status + '</Status>\n' +
      '    <Expiration>' + expiration + '</Expiration>\n' +
      '  </Rule>\n';
  }
  xml += '</LifecycleConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketLifecycle = function* getBucketLifecycle(bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'lifecycle', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  var rules = result.data.Rule || null;
  if (rules) {
    if (!isArray(rules)) {
      rules = [rules];
    }
    rules = rules.map(function (rule) {
      var item = {
        id: rule.ID,
        prefix: rule.Prefix,
        status: rule.Status,
      };
      if (rule.Expiration.Days) {
        item.days = rule.Expiration.Days;
      } else {
        item.date = rule.Expiration.Date;
      }
      return item;
    });
  }
  return {
    rules: rules,
    res: result.res
  };
};

proto.deleteBucketLifecycle = function* deleteBucketLifecycle(bucket, options) {
  var params = this._bucketRequestParams('DELETE', bucket, 'lifecycle', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.putBucketCORS = function* (bucket, rules, options) {
  rules = rules || [];
  assert(rules.length, 'rules is required');
  rules.forEach(rule => {
    assert(rule.allowedOrigin, 'allowedOrigin is required');
    assert(rule.allowedMethod, 'allowedMethod is required');
  });

  var params = this._bucketRequestParams('PUT', bucket, 'cors', options);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CORSConfiguration>';
  for (var i = 0, l = rules.length; i < l; i++) {
    var rule = rules[i];
    xml += '<CORSRule>';
    toArray(rule.allowedOrigin).forEach(function(val) {
      xml += '<AllowedOrigin>' + val + '</AllowedOrigin>';
    });
    toArray(rule.allowedMethod).forEach(function(val) {
      xml += '<AllowedMethod>' + val + '</AllowedMethod>';
    });
    toArray(rule.allowedHeader).forEach(function(val) {
      xml += '<AllowedHeader>' + val + '</AllowedHeader>';
    });
    toArray(rule.exposeHeader).forEach(function(val) {
      xml += '<ExposeHeader>' + val + '</ExposeHeader>';
    });
    if (rule.maxAgeSeconds) {
      xml += '<MaxAgeSeconds>' + rule.maxAgeSeconds + '</MaxAgeSeconds>';
    }
    xml += '</CORSRule>';
  }
  xml += '</CORSConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketCORS = function* (bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'cors', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  var rules = [];
  if (result.data && result.data.CORSRule) {
    var CORSRule = result.data.CORSRule;
    if (!isArray(CORSRule)) CORSRule = [ CORSRule ];
    CORSRule.forEach(function(rule) {
      var r = {};
      for (const name in rule) {
        r[name.slice(0, 1).toLowerCase() + name.slice(1, name.length)] = rule[name];
      }
      rules.push(r);
    });
  }
  return {
    rules: rules,
    res: result.res
  };
};

proto.deleteBucketCORS = function* (bucket, options) {
  var params = this._bucketRequestParams('DELETE', bucket, 'cors', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

// referer

proto.putBucketReferer = function* putBucketReferer(bucket, allowEmpty, referers, options) {
  var params = this._bucketRequestParams('PUT', bucket, 'referer', options);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<RefererConfiguration>\n';
  xml += '  <AllowEmptyReferer>' + (allowEmpty ? 'true' : 'false') + '</AllowEmptyReferer>\n';
  if (referers && referers.length > 0) {
    xml += '  <RefererList>\n';
    for (var i = 0; i < referers.length; i++) {
      xml += '    <Referer>' + referers[i] + '</Referer>\n';
    }
    xml += '  </RefererList>\n';
  } else {
    xml += '  <RefererList />\n';
  }
  xml += '</RefererConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    res: result.res,
  };
};

proto.getBucketReferer = function* getBucketReferer(bucket, options) {
  var params = this._bucketRequestParams('GET', bucket, 'referer', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  var referers = result.data.RefererList.Referer || null;
  if (referers) {
    if (!isArray(referers)) {
      referers = [referers];
    }
  }
  return {
    allowEmpty: result.data.AllowEmptyReferer === 'true',
    referers: referers,
    res: result.res
  };
};

proto.deleteBucketReferer = function* deleteBucketReferer(bucket, options) {
  return yield this.putBucketReferer(bucket, true, null, options);
};

// private apis

proto._bucketRequestParams = function _bucketRequestParams(method, bucket, subres, options) {
  return {
    method: method,
    bucket: bucket,
    subres: subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };
};

function isArray(arr) {
  if (Array.isArray) return Array.isArray(arr);
  return Object.prototype.toString.call(arr) === '[object Array]';
}

function toArray(obj) {
  if (!obj) return [];
  if (isArray(obj)) return obj;
  return [ obj ];
}
