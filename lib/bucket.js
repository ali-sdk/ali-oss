/**!
 * ali-oss - lib/bucket.js
 *
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var proto = exports;

/**
 * Bucket opertaions
 */

proto.setBucket = function (name, region) {
  this.options.name = name;
  if (region) {
    this.setRegion(region);
  }
  return this;
};

proto.putBucket = function* (name, options) {
  options = options || {};
  var region = options.region || this.options.region;
  var params = {
    resource: '/',
    authResource: '/' + name + '/',
    region: name + '.' + region,
    method: 'PUT',
    timeout: options && options.timeout,
  };
  if (region) {
    params.mime = 'xml';
    params.content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<CreateBucketConfiguration><LocationConstraint>' + region +
      '</LocationConstraint></CreateBucketConfiguration>';
  }
  var result = yield this.request(params);
  if (result.status === 200) {
    return {
      bucket: result.headers.location.substring(1),
      res: result.res
    };
  }

  throw yield* this.requestError(result);
};

proto.listBuckets = function* (query, options) {
  // prefix, marker, max-keys
  var result = yield* this.request({
    method: 'GET',
    resource: '/',
    query: query,
    timeout: options && options.timeout
  });

  if (result.status === 200) {
    var data = yield this.parseXML(result.data);
    var buckets = data.Buckets || null;
    if (buckets) {
      if (buckets.Bucket) {
        buckets = buckets.Bucket;
      }
      if (!Array.isArray(buckets)) {
        buckets = [buckets];
      }
    }
    return {
      buckets: buckets,
      owner: data.Owner,
      isTruncated: data.IsTruncated === 'true',
      nextMarker: data.NextMarker || null,
      res: result.res
    };
  }

  throw yield* this.requestError(result);
};

proto.deleteBucket = function* (name, options) {
  options = options || {};
  var region = options.region || this.options.region;
  var result = yield* this.request({
    method: 'DELETE',
    resource: '/',
    authResource: '/' + name + '/',
    region: name + '.' + region,
    timeout: options && options.timeout,
  });
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res
    };
  }
  throw yield* this.requestError(result);
};
