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

proto.listBuckets = function* (query, options) {
  // prefix, marker, max-keys
  var result = yield* this.request({
    method: 'GET',
    resource: '/',
    query: query,
    timeout: options && options.timeout
  });
};

proto.putBucket = function* () {

};
