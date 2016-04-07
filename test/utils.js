/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');

exports.throws = function* (block, checkError) {
  try {
    yield block();
  } catch (err) {
    if (typeof checkError === 'function') {
      return checkError(err);
    }
    // throws(block, errorName)
    if (typeof checkError === 'string') {
      return assert.equal(err.name, checkError);
    }
    // throw(block, RegExp)
    if (!checkError.test(err.toString())) {
      throw new Error('expected ' + err.toString() + ' to match ' + checkError.toString());
    }
    return;
  }
  throw new Error(block.toString() + ' should throws error');
};

exports.sleep = function (ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
};

exports.cleanBucket = function* (store, bucket, region) {
  store.useBucket(bucket, region);
  var result = yield store.list({
    'max-keys': 1000
  });
  result.objects = result.objects || [];
  for (var i = 0; i < result.objects.length; i++) {
    var obj = result.objects[i];
    yield store.delete(obj.name);
  }

  var result = yield store.listUploads({
    'max-uploads': 1000
  });
  var uploads = result.uploads || [];
  for (var i = 0; i < uploads.length; i++) {
    var up = uploads[i];
    yield store.abortMultipartUpload(up.name, up.uploadId);
  }
  yield store.deleteBucket(bucket, region);
};

exports.prefix = process.platform + '-' + process.version + '/';
if (process.execPath.indexOf('iojs') >= 0) {
  exports.prefix = 'iojs-' + exports.prefix;
}
