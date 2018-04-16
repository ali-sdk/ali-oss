/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */


/**
 * Module dependencies.
 */

const assert = require('assert');
const fs = require('fs');
const urlutil = require('url');
const platform = require('platform');

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
      throw new Error(`expected ${err.toString()} to match ${checkError.toString()}`);
    }
    return;
  }
  throw new Error(`${block.toString()} should throws error`);
};

exports.sleep = function (ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
};

exports.cleanBucket = function* (store, bucket, region) {
  store.useBucket(bucket, region);
  let result = yield store.list({
    'max-keys': 1000,
  });
  result.objects = result.objects || [];
  for (let i = 0; i < result.objects.length; i++) {
    const obj = result.objects[i];
    yield store.delete(obj.name);
  }

  result = yield store.listUploads({
    'max-uploads': 1000,
  });
  const uploads = result.uploads || [];
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    yield store.abortMultipartUpload(up.name, up.uploadId);
  }
  yield store.deleteBucket(bucket, region);
};

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}-${new Date().getTime()}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}-${new Date().getTime()}/`;// unique prefix add time timestamp
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.createTempFile = function* (name, size) {
  const tmpdir = '/tmp/.oss/';
  if (!fs.existsSync(tmpdir)) {
    fs.mkdirSync(tmpdir);
  }

  yield new Promise(((resolve, reject) => {
    const rs = fs.createReadStream('/dev/urandom', {
      start: 0,
      end: size - 1,
    });
    const ws = fs.createWriteStream(tmpdir + name);
    rs.pipe(ws);
    ws.on('finish', (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));

  return tmpdir + name;
};

/*
 * cb = {
 *   url: 'd.rockuw.com:4567',
 *   query: {user: 'me'},
 *   contentType: 'application/json',
 *   body: '{"hello": "world"}'
 * };
 */
exports.encodeCallback = function (cb) {
  const url = urlutil.parse(cb.url);
  url.query = cb.query;

  const json = {
    callbackUrl: url.format(),
    callbackBody: cb.body,
    callbackBodyType: cb.contentType || 'application/x-www-form-urlencoded',
  };

  return new Buffer(JSON.stringify(json)).toString('base64');
};
