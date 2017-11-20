'use strict';

var assert = require('assert');
var utils = require('./utils');
var oss = require('../');
var config = require('./config').oss;
var ms = require('humanize-ms');
var metaSyncTime = require('./config').metaSyncTime;

// only run on travis ci

// if (!process.env.CI) {
//   return;
// }

describe('test/bucket.test.js', () => {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);

    var bucketResult = yield this.store.listBuckets({
      // prefix: '',
      "max-keys": 20
    });
    console.log(bucketResult.buckets);
    for (const bucket of bucketResult.buckets) {
      if (bucket.name.startsWith('ali-oss-test-bucket-') || bucket.name.startsWith('ali-oss-list-buckets-')) {
        yield this.store.deleteBucket(bucket.name);
        console.log('delete %j', bucket);
      }
    }

    this.bucket = 'ali-oss-test-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);

    var result = yield this.store.putBucket(this.bucket);
    assert.equal(result.bucket, this.bucket);
    assert.equal(result.res.status, 200);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('putBucket()', function () {

    it('should create a new bucket', function* () {
      var name = 'ali-oss-test-putbucket-' + prefix.replace(/[\/\.]/g, '-');
      name = name.substring(0, name.length - 1);

      var result = yield this.store.putBucket(name);
      assert.equal(result.bucket, name);
      assert.equal(result.res.status, 200);

      // TODO: 创建的 private 权限 bucket，无法进行 putBucket 操作，需要和服务端进行确认
      // var result = yield this.store.putBucket(name);
      // assert.equal(result.res.status, 200);
      // assert.equal(result.bucket, name);

      var result = yield this.store.deleteBucket(name);
      assert(result.res.status === 200 || result.res.status === 204);
    });

    it('should create a new bucket with acl', function* () {
      var name = 'ali-oss-test-putbucket-acl-' + prefix.replace(/[\/\.]/g, '-');
      name = name.substring(0, name.length - 1);

      var acl = 'public-read'

      var result = yield this.store.putBucket(name, {acl: acl});
      assert.equal(result.bucket, name);
      assert.equal(result.res.status, 200);

      result = yield  this.store.getBucketACL(name);
      assert.equal(result.acl, acl);
      assert.equal(result.res.status, 200);

      result = yield this.store.deleteBucket(name);
      assert(result.res.status === 200 || result.res.status === 204);
    });

    it('should create a new bucket with storage class', function* () {
      var name = 'ali-oss-test-putbucket-storageclass-' + prefix.replace(/[\/\.]/g, '-');
      name = name.substring(0, name.length - 1);

      var storageClass = 'Archive'

      var result = yield this.store.putBucket(name, {storageClass: storageClass});
      assert.equal(result.bucket, name);
      assert.equal(result.res.status, 200);
      
      // TODO: use GetBuckInfo
      result = yield this.store.listBuckets({prefix: name});
      assert.equal(result.res.status, 200);
      assert.equal(result.buckets[0].storageClass, storageClass);

      result = yield this.store.deleteBucket(name);
      assert(result.res.status === 200 || result.res.status === 204);
    });
  });

  describe('deleteBucket()', function () {
    it('should delete not exists bucket throw NoSuchBucketError', function* () {
      yield utils.throws(function* () {
        yield this.store.deleteBucket('not-exists-bucket');
      }.bind(this), 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', function* () {
      this.store.useBucket(this.bucket);
      yield this.store.put('ali-oss-test-bucket.txt', __filename);
      yield utils.throws(function* () {
        yield this.store.deleteBucket(this.bucket);
      }.bind(this), 'BucketNotEmptyError');
      yield this.store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', function () {
    it('should set bucket acl to public-read-write', function* () {
      var result = yield this.store.putBucket(this.bucket, {acl: 'public-read'});
      assert.equal(result.res.status, 200);

      var result = yield this.store.putBucketACL(this.bucket, 'public-read-write');
      assert.equal(result.res.status, 200);
      assert.equal(result.bucket, this.bucket);

      // Need wait some time for bucket meta sync
      yield utils.sleep(ms(metaSyncTime));

      var r = yield this.store.getBucketACL(this.bucket);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', function* () {
      var bucket = this.bucket + '-new';
      var result = yield this.store.putBucketACL(bucket, 'public-read');
      assert.equal(result.res.status, 200);
      assert.equal(result.bucket, bucket);

      yield utils.sleep(ms(metaSyncTime));

      var result = yield this.store.getBucketACL(bucket);
      assert.equal(result.res.status, 200);
      assert.equal(result.acl, 'public-read');

      yield this.store.deleteBucket(bucket);
    });
  });

  describe('listBuckets()', function () {
    before(function* () {
      // create 2 buckets
      this.listBucketsPrefix = 'ali-oss-list-buckets-';
      for (var i = 0; i < 2; i ++) {
        var name = this.listBucketsPrefix + i;
        var result = yield this.store.putBucket(name);
        assert.equal(result.res.status, 200);
      }
    });

    it('should list buckets by prefix', function* () {
      var result = yield this.store.listBuckets({
        prefix: this.listBucketsPrefix,
        "max-keys": 20
      });

      assert(Array.isArray(result.buckets));
      assert.equal(result.buckets.length, 2);
      assert(!result.isTruncated);
      assert.equal(result.nextMarker, null);
      assert(result.owner);
      assert.equal(typeof result.owner.id, 'string');
      assert.equal(typeof result.owner.displayName, 'string');

      for (var i = 0; i < 2; i ++) {
        var name = this.listBucketsPrefix + i;
        assert.equal(result.buckets[i].name, name);
      }
    });

    after(function* () {
      for (var i = 0; i < 2; i ++) {
        var name = this.listBucketsPrefix + i;
        try {
          yield this.store.deleteBucket(name);
        } catch (_) {}
      }
    });
  });

  describe('putBucketLogging(), getBucketLogging(), deleteBucketLogging()', function () {
    it('should create, get and delete the logging', function* () {
      var result = yield this.store.putBucketLogging(this.bucket, this.bucket, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      var result = yield this.store.putBucketLogging(this.bucket, this.bucket, 'logs/');
      assert.equal(result.res.status, 200);
      
      yield utils.sleep(ms(metaSyncTime));

      // get the logging settings
      var result = yield this.store.getBucketLogging(this.bucket);
      assert(result.enable)
      assert.equal(result.targetBucket, this.bucket)
      assert.equal(result.targetPrefix, 'logs/')

      assert.equal(result.res.status, 200);

      // delete it
      var result = yield this.store.deleteBucketLogging(this.bucket);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', function () {
    it('should create, get and delete the website settings', function* () {
      var result = yield this.store.putBucketWebsite(this.bucket, {
        index: 'index.html'
      });
      assert.equal(result.res.status, 200);
      yield utils.sleep(ms(metaSyncTime));
      // put again will be fine
      var result = yield this.store.putBucketWebsite(this.bucket, {
        index: 'index.htm',
        error: 'error.htm'
      });
      assert.equal(result.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      var result = yield this.store.getBucketWebsite(this.bucket);
      assert.equal(result.index, 'index.htm');
      assert.equal(result.error, 'error.htm');
      assert.equal(result.res.status, 200);

      // delete it
      var result = yield this.store.deleteBucketWebsite(this.bucket);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketLifecycle(), getBucketLifecycle(), deleteBucketLifecycle()', function () {
    it('should create, get and delete the lifecycle', function* () {
      var result = yield this.store.putBucketLifecycle(this.bucket, [{
        id: 'delete after one day',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: { days: 1 }
      }]);
      assert.equal(result.res.status, 200);

      // put again will be fine
      var rules = [
        {
          id: 'delete after one day',
          prefix: 'logs/',
          status: 'Enabled',
          expiration: { days: 1 },
          abortMultipartUpload: { days: 1 }
        },
        {
          prefix: 'logs2/',
          status: 'Disabled',
          expiration: { days: 70 },
          transition: [{ days: 30, storageClass: 'IA'}, { days: 60, storageClass: 'Archive'}]
        },
        {
          prefix: 'logs3/',
          status: 'Enabled',
          expiration: { createdBeforeDate: '2022-10-12T00:00:00.000Z' },
          abortMultipartUpload: { createdBeforeDate: '2022-10-11T00:00:00.000Z' },
          transition: [{ createdBeforeDate: '2022-10-11T00:00:00.000Z', storageClass: 'IA'}]
        }
      ]
      var result = yield this.store.putBucketLifecycle(this.bucket, rules);
      assert.equal(result.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      var result = yield this.store.getBucketLifecycle(this.bucket);

      assert.equal(result.res.status, 200);
      // remove id
      rules.forEach(function(item, index) {
        if (!item.id) {
          assert.equal(typeof result.rules[index].id, 'string');
          delete result.rules[index].id
        }
      })
      assert.deepEqual(rules, result.rules);

      // delete it
      var result = yield this.store.deleteBucketLifecycle(this.bucket);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', function () {
    it('should create, get and delete the referer', function* () {
      var result = yield this.store.putBucketReferer(this.bucket, true, [
        'http://npm.taobao.org'
      ]);
      assert.equal(result.res.status, 200);

      // put again will be fine
      var referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org'
      ];
      var result = yield this.store.putBucketReferer(this.bucket, false, referers);
      assert.equal(result.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      var result = yield this.store.getBucketReferer(this.bucket);
      assert(Array.isArray(result.referers));
      assert.equal(typeof result.allowEmpty, 'boolean');
      assert.equal(result.res.status, 200);

      // delete it
      var result = yield this.store.deleteBucketReferer(this.bucket);
      assert.equal(result.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', function () {
    afterEach(function* () {
      // delete it
      var result = yield this.store.deleteBucketCORS(this.bucket);
      assert.equal(result.res.status, 204);
    });

    it('should create, get and delete the cors', function* () {
      var rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }];
      var result = yield this.store.putBucketCORS(this.bucket, rules);
      assert.equal(result.res.status, 200);

      result = yield this.store.getBucketCORS(this.bucket);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }]);
    });

    it('should overwrite cors', function* () {
      var rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }];
      var result = yield this.store.putBucketCORS(this.bucket, rules);
      assert.equal(result.res.status, 200);

      result = yield this.store.getBucketCORS(this.bucket);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }]);

      rules = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }];
      var result = yield this.store.putBucketCORS(this.bucket, rules);
      assert.equal(result.res.status, 200);

      result = yield this.store.getBucketCORS(this.bucket);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }]);
    });

    it('should check rules', function* () {
      try {
        yield this.store.putBucketCORS(this.bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', function* () {
      try {
        yield this.store.putBucketCORS(this.bucket, [{}]);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedOrigin is required');
      }
    });

    it('should check allowedMethod', function* () {
      try {
        var rules = [{
          allowedOrigin: '*',
        }];
        yield this.store.putBucketCORS(this.bucket, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', function* () {
      try {
        yield this.store.getBucketCORS(this.bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });
});
