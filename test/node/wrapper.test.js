
const assert = require('assert');
const config = require('../config').oss;
const stsConfig = require('../config').sts;
const OSS = require('../..').Wrapper;

const { STS } = OSS;
const utils = require('./utils');
const fs = require('fs');
const { md5 } = require('utility');
const urllib = require('urllib');
const SyncClient = require('../..');

describe('test/wrapper.test.js', () => {
  const { prefix } = utils;

  before(function* () {
    this.store = OSS(config);
    this.bucket = `ali-oss-test-wrapper-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    this.syncClient = new SyncClient(config);
    yield this.syncClient.putBucket(this.bucket, this.region);
    this.syncClient.useBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.syncClient, this.bucket, this.region);
  });

  it('should work for bucket operations', function () {
    const { bucket } = this;

    return this.store.listBuckets({
      prefix: bucket,
      'max-keys': 1,
    }).then((val) => {
      assert.equal(val.res.status, 200);
      assert.equal(Array.isArray(val.buckets), true);
      assert.equal(val.buckets.length, 1);
      assert.equal(val.buckets[0].name, bucket);
    });
  });

  it('should work for object operations', function () {
    const name = 'async-put-object';
    const content = 'should work for object operations';

    const { store } = this;
    return store.put(name, new Buffer(content)).then((val) => {
      assert.equal(val.res.status, 200);
      assert.equal(val.name, name);

      return store.get(name);
    }).then((val) => {
      assert.equal(val.res.status, 200);
      assert.equal(val.content.toString(), content);
    });
  });

  it('should work for multipart operations', function* () {
    const name = 'async-multipart-upload';
    const fileName = yield utils.createTempFile(name, 1024 * 1024);

    const { store } = this;
    let count = 0;
    return store.multipartUpload(name, fileName, {
      partSize: 100 * 1024,
      progress(p) {
        return function (done) {
          count++;
          done();
        };
      },
    }).then((val) => {
      assert.equal(val.res.status, 200);
      assert.equal(count, 12);

      return store.get(name);
    }).then((val) => {
      assert.equal(val.res.status, 200);
      const fileBuf = fs.readFileSync(fileName);
      assert.equal(val.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.equal(md5(val.content), md5(fileBuf));
    });
  });

  it('should work for signature url', function* () {
    const name = 'object-sig-url';
    const content = 'should work for signature url';

    yield this.syncClient.put(name, new Buffer(content));

    const url = this.store.signatureUrl(name);
    const urlRes = yield urllib.request(url);
    assert.equal(urlRes.data.toString(), content);
  });

  it('should work on error', function () {
    const name = 'file-not-exist';

    return this.store.get(name).then((val) => {
      assert(false);
    }).catch((err) => {
      assert.equal(err.name, 'NoSuchKeyError');
      assert.equal(err.status, 404);
      assert.equal(typeof err.requestId, 'string');
    });
  });

  it('should work for sts operations', () => {
    const stsClient = new STS(stsConfig);
    return stsClient.assumeRole(stsConfig.roleArn).then((val) => {
      assert.equal(val.res.status, 200);
      assert.equal(typeof val.credentials.AccessKeyId, 'string');
      assert.equal(typeof val.credentials.AccessKeySecret, 'string');
      assert.equal(typeof val.credentials.SecurityToken, 'string');
    });
  });
});
