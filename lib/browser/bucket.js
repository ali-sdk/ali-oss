'use strict';

const assert = require('assert');

var proto = exports;

/**
 * Bucket opertaions
 */

// TODO: OSS server currently do not support CORS requests for bucket operations
// proto.listBuckets = function* listBuckets(query, options) {
//   // prefix, marker, max-keys
//   var result = yield this.request({
//     method: 'GET',
//     query: query,
//     timeout: options && options.timeout,
//     ctx: options && options.ctx,
//   });
//
//   if (result.status === 200) {
//     var data = yield this.parseXML(result.data);
//     var buckets = data.Buckets || null;
//     if (buckets) {
//       if (buckets.Bucket) {
//         buckets = buckets.Bucket;
//       }
//       if (!isArray(buckets)) {
//         buckets = [buckets];
//       }
//       buckets = buckets.map(function (item) {
//         return {
//           name: item.Name,
//           region: item.Location,
//           creationDate: item.CreationDate,
//         };
//       });
//     }
//     return {
//       buckets: buckets,
//       owner: {
//         id: data.Owner.ID,
//         displayName: data.Owner.DisplayName,
//       },
//       isTruncated: data.IsTruncated === 'true',
//       nextMarker: data.NextMarker || null,
//       res: result.res
//     };
//   }
//
//   throw yield this.requestError(result);
// };

proto.useBucket = function useBucket(name, region) {
  this.options.bucket = name;
  return this;
};

proto.setBucket = function useBucket(name) {
  this.options.bucket = name;
  return this;
};

proto.getBucket = function getBucket() {
  return this.options.bucket;
};

proto.putBucket = function* putBucket(name, region, options) {
  var params = this._bucketRequestParams('PUT', name, '', options);
  if (region) {
    params.mime = 'xml';
    params.content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<CreateBucketConfiguration><LocationConstraint>' + region +
      '</LocationConstraint></CreateBucketConfiguration>';
  }
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    bucket: result.headers.location && result.headers.location.substring(1) || null,
    res: result.res
  };
};

proto.deleteBucket = function* deleteBucket(name, region, options) {
  var params = this._bucketRequestParams('DELETE', name, '', options);
  var result = yield this.request(params);
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res
    };
  }
  throw yield this.requestError(result);
};

// acl

proto.putBucketACL = function* putBucketACL(name, region, acl, options) {
  var params = this._bucketRequestParams('PUT', name, 'acl', options);
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

proto.getBucketACL = function* getBucketACL(name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'acl', options);
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

proto.putBucketLogging = function* putBucketLogging(name, region, prefix, options) {
  var params = this._bucketRequestParams('PUT', name, 'logging', options);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<BucketLoggingStatus>\n' +
    '<LoggingEnabled>\n<TargetBucket>' + name + '</TargetBucket>\n';
  if (prefix) {
    xml += '<TargetPrefix>' + prefix + '</TargetPrefix>\n';
  }
  xml += '</LoggingEnabled>\n</BucketLoggingStatus>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketLogging = function* getBucketLogging(name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'logging', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  var enable = result.data.LoggingEnabled;
  return {
    enable: !!enable,
    prefix: enable && enable.TargetPrefix || null,
    res: result.res,
  };
};

proto.deleteBucketLogging = function* deleteBucketLogging(name, region, options) {
  var params = this._bucketRequestParams('DELETE', name, 'logging', options);
  params.successStatuses = [204, 200];
  var result = yield this.request(params);
  return {
    res: result.res,
  };
};

// website

proto.putBucketWebsite = function* putBucketWebsite(name, region, config, options) {
  // config: index, [error]
  var params = this._bucketRequestParams('PUT', name, 'website', options);
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

proto.getBucketWebsite = function* getBucketWebsite(name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'website', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  var result = yield this.request(params);
  return {
    index: result.data.IndexDocument.Suffix,
    error: result.data.ErrorDocument && result.data.ErrorDocument.Key || null,
    res: result.res
  };
};

proto.deleteBucketWebsite = function* deleteBucketWebsite(name, region, options) {
  var params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

// lifecycle

proto.putBucketLifecycle = function* putBucketLifecycle(name, region, rules, options) {
  // rules: [rule, ...]
  // rule: [id], prefix, status, expiration, [days or date]
  // status: 'Enabled' or 'Disabled'
  var params = this._bucketRequestParams('PUT', name, 'lifecycle', options);
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

proto.getBucketLifecycle = function* getBucketLifecycle(name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'lifecycle', options);
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

proto.deleteBucketLifecycle = function* deleteBucketLifecycle(name, region, options) {
  var params = this._bucketRequestParams('DELETE', name, 'lifecycle', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

proto.putBucketCORS = function* (name, region, rules, options) {
  rules = rules || [];
  assert(rules.length, 'rules is required');
  rules.forEach(rule => {
    assert(rule.allowedOrigin, 'allowedOrigin is required');
    assert(rule.allowedMethod, 'allowedMethod is required');
  });

  var params = this._bucketRequestParams('PUT', name, 'cors', options);
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

proto.getBucketCORS = function* (name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'cors', options);
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

proto.deleteBucketCORS = function* (name, region, options) {
  var params = this._bucketRequestParams('DELETE', name, 'cors', options);
  params.successStatuses = [204];
  var result = yield this.request(params);
  return {
    res: result.res
  };
};

// referer

proto.putBucketReferer = function* putBucketReferer(name, region, allowEmpty, referers, options) {
  var params = this._bucketRequestParams('PUT', name, 'referer', options);
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

proto.getBucketReferer = function* getBucketReferer(name, region, options) {
  var params = this._bucketRequestParams('GET', name, 'referer', options);
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

proto.deleteBucketReferer = function* deleteBucketReferer(name, region, options) {
  return yield this.putBucketReferer(name, region, true, null, options);
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
