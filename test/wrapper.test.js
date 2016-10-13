'use strict';

var assert = require('assert');
var config = require('./config').oss;
var stsConfig = require('./config').sts;
var OSS = require('../').Wrapper;
var STS = OSS.STS;
var utils = require('./utils');
var fs = require('fs');
var md5 = require('utility').md5;
var urllib = require('urllib');

describe('test/wrapper.test.js', () => {
  var prefix = utils.prefix;

  before(function* () {
    this.store = OSS(config);
    this.bucket = 'ali-oss-test-object-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    var SyncClient = require('..');
    this.syncClient = new SyncClient(config);
    yield this.syncClient.putBucket(this.bucket, this.region);
    this.syncClient.useBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.syncClient, this.bucket, this.region);
  });

  it('should work for bucket operations', function () {
    var bucket = this.bucket;

    return this.store.listBuckets({
      prefix: bucket,
      'max-keys': 1
    }).then(function (val) {
      assert.equal(val.res.status, 200);
      assert.equal(Array.isArray(val.buckets), true);
      assert.equal(val.buckets.length, 1);
      assert.equal(val.buckets[0].name, bucket);
    });
  });

  it('should work for object operations', function () {
    var name = 'async-put-object';
    var content = 'should work for object operations';

    var store = this.store;
    return store.put(name, new Buffer(content)).then(function (val) {
      assert.equal(val.res.status, 200);
      assert.equal(val.name, name);

      return store.get(name);
    }).then(function (val) {
      assert.equal(val.res.status, 200);
      assert.equal(val.content.toString(), content);
    });
  });

  it('should work for multipart operations', function* () {
    var name = 'async-multipart-upload';
    var fileName = yield utils.createTempFile(name, 1024 * 1024);

    var store = this.store;
    var count = 0;
    return store.multipartUpload(name, fileName, {
      partSize: 100 * 1024,
      progress: function (p) {
        return function (done) {
          count++;
          done();
        }
      }
    }).then(function (val) {
      assert.equal(val.res.status, 200);
      assert.equal(count, Math.ceil(1024 / 100));

      return store.get(name);
    }).then(function (val) {
      assert.equal(val.res.status, 200);
      var fileBuf = fs.readFileSync(fileName);
      assert.equal(val.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.equal(md5(val.content), md5(fileBuf));
    });
  });

  it('should work for signature url', function* () {
    var name = 'object-sig-url';
    var content = 'should work for signature url';

    yield this.syncClient.put(name, new Buffer(content));

    var url = this.store.signatureUrl(name);
    var urlRes = yield urllib.request(url);
    assert.equal(urlRes.data.toString(), content);
  });

  it('should work on error', function () {
    var name = 'file-not-exist';

    return this.store.get(name).then(function (val) {
      assert(false);
    }).catch(function (err) {
      assert.equal(err.name, 'NoSuchKeyError');
      assert.equal(err.status, 404);
      assert.equal(typeof err.requestId, 'string');
    });
  });

  it('should work for sts operations', function () {
    var stsClient = new STS(stsConfig);
    return stsClient.assumeRole(stsConfig.roleArn).then(function (val) {
      assert.equal(val.res.status, 200);
      assert.equal(typeof val.credentials.AccessKeyId, 'string');
      assert.equal(typeof val.credentials.AccessKeySecret, 'string');
      assert.equal(typeof val.credentials.SecurityToken, 'string');
    });
  });
});
