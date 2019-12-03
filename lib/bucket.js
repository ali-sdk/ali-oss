

const assert = require('assert');
const _checkBucketName = require('./common/utils/checkBucketName');

const proto = exports;


function isArray(arr) {
  if (Array.isArray) return Array.isArray(arr);
  return Object.prototype.toString.call(arr) === '[object Array]';
}

function toArray(obj) {
  if (!obj) return [];
  if (isArray(obj)) return obj;
  return [obj];
}

/**
 * check Bucket Name
 */

proto._checkBucketName = function (name) {
  if (!_checkBucketName(name)) {
    throw new Error('The bucket must be conform to the specifications');
  }
};

/**
 * Bucket opertaions
 */

proto.listBuckets = async function listBuckets(query, options) {
  // prefix, marker, max-keys
  const result = await this.request({
    method: 'GET',
    query,
    timeout: options && options.timeout,
    ctx: options && options.ctx
  });

  if (result.status === 200) {
    const data = await this.parseXML(result.data);
    let buckets = data.Buckets || null;
    if (buckets) {
      if (buckets.Bucket) {
        buckets = buckets.Bucket;
      }
      if (!isArray(buckets)) {
        buckets = [buckets];
      }
      buckets = buckets.map(item => ({
        name: item.Name,
        region: item.Location,
        creationDate: item.CreationDate,
        StorageClass: item.StorageClass
      }));
    }
    return {
      buckets,
      owner: {
        id: data.Owner.ID,
        displayName: data.Owner.DisplayName
      },
      isTruncated: data.IsTruncated === 'true',
      nextMarker: data.NextMarker || null,
      res: result.res
    };
  }

  throw await this.requestError(result);
};

proto.useBucket = function useBucket(name) {
  return this.setBucket(name);
};

proto.setBucket = function useBucket(name) {
  this._checkBucketName(name);
  this.options.bucket = name;
  return this;
};

proto.getBucket = function getBucket() {
  return this.options.bucket;
};

proto.getBucketLocation = async function getBucketLocation(name, options) {
  this._checkBucketName(name);
  name = name || this.getBucket();
  const params = this._bucketRequestParams('GET', name, 'location', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    location: result.data,
    res: result.res
  };
};

proto.getBucketInfo = async function getBucketInfo(name, options) {
  this._checkBucketName(name);
  name = name || this.getBucket();
  const params = this._bucketRequestParams('GET', name, 'bucketInfo', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    bucket: result.data.Bucket,
    res: result.res
  };
};

proto.putBucket = async function putBucket(name, options) {
  this._checkBucketName(name);
  options = options || {};
  const params = this._bucketRequestParams('PUT', name, '', options);

  const startTag = '<?xml version="1.0" encoding="UTF-8"?>\n<CreateBucketConfiguration>';
  const endTag = '</CreateBucketConfiguration>';
  let paramlXML = '';

  // server not support
  // if (region) {
  //   paramlXML += `<LocationConstraint>${region}</LocationConstraint>`;
  //   params.content = `${startTag}${paramlXML}${endTag}`;
  // }

  if (options.StorageClass) {
    paramlXML += `<StorageClass>${options.StorageClass}</StorageClass>`;
  }

  if (paramlXML) {
    params.mime = 'xml';
    params.content = `${startTag}${paramlXML}${endTag}`;
  }

  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    bucket: (result.headers.location && result.headers.location.substring(1)) || null,
    res: result.res
  };
};

proto.deleteBucket = async function deleteBucket(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, '', options);
  const result = await this.request(params);
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res
    };
  }
  throw await this.requestError(result);
};

// acl

proto.putBucketACL = async function putBucketACL(name, acl, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'acl', options);
  params.headers = {
    'x-oss-acl': acl
  };
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    bucket: (result.headers.location && result.headers.location.substring(1)) || null,
    res: result.res
  };
};

proto.getBucketACL = async function getBucketACL(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'acl', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName
    },
    res: result.res
  };
};

// logging

proto.putBucketLogging = async function putBucketLogging(name, prefix, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'logging', options);
  let xml = `${'<?xml version="1.0" encoding="UTF-8"?>\n<BucketLoggingStatus>\n' +
    '<LoggingEnabled>\n<TargetBucket>'}${name}</TargetBucket>\n`;
  if (prefix) {
    xml += `<TargetPrefix>${prefix}</TargetPrefix>\n`;
  }
  xml += '</LoggingEnabled>\n</BucketLoggingStatus>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketLogging = async function getBucketLogging(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'logging', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const enable = result.data.LoggingEnabled;
  return {
    enable: !!enable,
    prefix: (enable && enable.TargetPrefix) || null,
    res: result.res
  };
};

proto.deleteBucketLogging = async function deleteBucketLogging(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'logging', options);
  params.successStatuses = [204, 200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

// website

proto.putBucketWebsite = async function putBucketWebsite(name, config, options) {
  this._checkBucketName(name);
  // config: index, [error]
  const params = this._bucketRequestParams('PUT', name, 'website', options);
  config = config || {};
  config.index = config.index || 'index.html';
  let xml = `${'<?xml version="1.0" encoding="UTF-8"?>\n<WebsiteConfiguration>\n' +
    ' <IndexDocument><Suffix>'}${config.index}</Suffix></IndexDocument>\n`;
  if (config.error) {
    xml += `<ErrorDocument><Key>${config.error}</Key></ErrorDocument>\n`;
  }
  xml += '</WebsiteConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketWebsite = async function getBucketWebsite(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'website', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    index: result.data.IndexDocument.Suffix,
    error: (result.data.ErrorDocument && result.data.ErrorDocument.Key) || null,
    res: result.res
  };
};

proto.deleteBucketWebsite = async function deleteBucketWebsite(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

// lifecycle

proto.putBucketLifecycle = async function putBucketLifecycle(name, rules, options) {
  this._checkBucketName(name);
  // rules: [rule, ...]
  // rule: [id], prefix, status, expiration, [days or date]
  // status: 'Enabled' or 'Disabled'
  const params = this._bucketRequestParams('PUT', name, 'lifecycle', options);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<LifecycleConfiguration>\n';
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const expiration = rule.days ?
      `<Days>${rule.days}</Days>`
      :
      `<Date>${rule.date}</Date>`;
    const id = rule.id ? `<ID>${rule.id}</ID>\n` : '';
    xml += `  <Rule>\n${id
    }    <Prefix>${rule.prefix}</Prefix>\n` +
      `    <Status>${rule.status}</Status>\n` +
      `    <Expiration>${expiration}</Expiration>\n` +
      '  </Rule>\n';
  }
  xml += '</LifecycleConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketLifecycle = async function getBucketLifecycle(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'lifecycle', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  let rules = result.data.Rule || null;
  if (rules) {
    if (!isArray(rules)) {
      rules = [rules];
    }
    rules = rules.map((rule) => {
      const item = {
        id: rule.ID,
        prefix: rule.Prefix,
        status: rule.Status
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
    rules,
    res: result.res
  };
};

proto.deleteBucketLifecycle = async function deleteBucketLifecycle(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'lifecycle', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.putBucketCORS = async function putBucketCORS(name, rules, options) {
  this._checkBucketName(name);
  rules = rules || [];
  assert(rules.length, 'rules is required');
  rules.forEach((rule) => {
    assert(rule.allowedOrigin, 'allowedOrigin is required');
    assert(rule.allowedMethod, 'allowedMethod is required');
  });

  const params = this._bucketRequestParams('PUT', name, 'cors', options);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CORSConfiguration>';
  const parseOrigin = (val) => {
    xml += `<AllowedOrigin>${val}</AllowedOrigin>`;
  };
  const parseMethod = (val) => {
    xml += `<AllowedMethod>${val}</AllowedMethod>`;
  };
  const parseHeader = (val) => {
    xml += `<AllowedHeader>${val}</AllowedHeader>`;
  };
  const parseExposeHeader = (val) => {
    xml += `<ExposeHeader>${val}</ExposeHeader>`;
  };
  for (let i = 0, l = rules.length; i < l; i++) {
    const rule = rules[i];
    xml += '<CORSRule>';

    toArray(rule.allowedOrigin).forEach(parseOrigin);
    toArray(rule.allowedMethod).forEach(parseMethod);
    toArray(rule.allowedHeader).forEach(parseHeader);
    toArray(rule.exposeHeader).forEach(parseExposeHeader);
    if (rule.maxAgeSeconds) {
      xml += `<MaxAgeSeconds>${rule.maxAgeSeconds}</MaxAgeSeconds>`;
    }
    xml += '</CORSRule>';
  }
  xml += '</CORSConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketCORS = async function getBucketCORS(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'cors', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const rules = [];
  if (result.data && result.data.CORSRule) {
    let { CORSRule } = result.data;
    if (!isArray(CORSRule)) CORSRule = [CORSRule];
    CORSRule.forEach((rule) => {
      const r = {};
      Object.keys(rule).forEach((key) => {
        r[key.slice(0, 1).toLowerCase() + key.slice(1, key.length)] = rule[key];
      });
      rules.push(r);
    });
  }
  return {
    rules,
    res: result.res
  };
};

proto.deleteBucketCORS = async function deleteBucketCORS(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'cors', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

// referer

proto.putBucketReferer = async function putBucketReferer(name, allowEmpty, referers, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'referer', options);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<RefererConfiguration>\n';
  xml += `  <AllowEmptyReferer>${allowEmpty ? 'true' : 'false'}</AllowEmptyReferer>\n`;
  if (referers && referers.length > 0) {
    xml += '  <RefererList>\n';
    for (let i = 0; i < referers.length; i++) {
      xml += `    <Referer>${referers[i]}</Referer>\n`;
    }
    xml += '  </RefererList>\n';
  } else {
    xml += '  <RefererList />\n';
  }
  xml += '</RefererConfiguration>';
  params.content = xml;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};

proto.getBucketReferer = async function getBucketReferer(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'referer', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  let referers = result.data.RefererList.Referer || null;
  if (referers) {
    if (!isArray(referers)) {
      referers = [referers];
    }
  }
  return {
    allowEmpty: result.data.AllowEmptyReferer === 'true',
    referers,
    res: result.res
  };
};

proto.deleteBucketReferer = async function deleteBucketReferer(name, options) {
  this._checkBucketName(name);
  return await this.putBucketReferer(name, true, null, options);
};

// private apis

proto._bucketRequestParams = function _bucketRequestParams(method, bucket, subres, options) {
  return {
    method,
    bucket,
    subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx
  };
};
