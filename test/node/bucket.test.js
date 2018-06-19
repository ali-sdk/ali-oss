
const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;
const ms = require('humanize-ms');
const { metaSyncTime } = require('../config');

// only run on travis ci

// if (!process.env.CI) {
//   return;
// }

describe('test/bucket.test.js', () => {
  const { prefix } = utils;

  before(function* () {
    this.store = oss(config);

    const bucketResult = yield this.store.listBuckets({
      // prefix: '',
      'max-keys': 20,
    });
    console.log(bucketResult.buckets);

    /* eslint no-restricted-syntax: [0] */
    for (const bucket of bucketResult.buckets) {
      if (bucket.name.startsWith('ali-oss-test-bucket-') || bucket.name.startsWith('ali-oss-list-buckets-')) {
        yield this.store.deleteBucket(bucket.name);
        console.log('delete %j', bucket);
      }
    }

    this.bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    const result = yield this.store.putBucket(this.bucket, this.region);
    assert.equal(result.bucket, this.bucket);
    assert.equal(result.res.status, 200);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('putBucket()', () => {
    before(function () {
      this.name = `ali-oss-test-putbucket-${prefix.replace(/[/.]/g, '-')}`;
      this.name = this.name.substring(0, this.name.length - 1);

      // just for archive bucket test
      this.archvieBucket = `ali-oss-archive-bucket-${prefix.replace(/[/.]/g, '-')}`;
      this.archvieBucket = this.archvieBucket.substring(0, this.archvieBucket.length - 1);
    });

    it('should create a new bucket', function* () {
      const result1 = yield this.store.putBucket(this.name);
      assert.equal(result1.bucket, this.name);
      assert.equal(result1.res.status, 200);

      // create a exists should work
      const result2 = yield this.store.putBucket(this.name);
      assert.equal(result2.res.status, 200);
      assert.equal(result2.bucket, this.name);
    });

    it('should create an archive bucket', function* () {
      yield this.store.putBucket(this.archvieBucket, this.region, { StorageClass: 'Archive' });

      const result2 = yield this.store.listBuckets();
      const { buckets } = result2;
      const m = buckets.some(item => item.name === this.archvieBucket);
      assert(m === true);
      buckets.map((item) => {
        if (item.name === this.archvieBucket) {
          assert(item.StorageClass === 'Archive');
        }
        return 1;
      });
    });

    after(function* () {
      const result = yield this.store.deleteBucket(this.name);
      yield this.store.deleteBucket(this.archvieBucket);
      assert(result.res.status === 200 || result.res.status === 204);
    });
  });

  describe('getBucketInfo', () => {
    it('it should return correct bucketInfo when bucket exist', function* () {
      const result = yield this.store.getBucketInfo(this.bucket);
      assert.equal(result.res.status, 200);

      assert.equal(result.bucket.Location, `${this.region}`);
      assert.equal(result.bucket.ExtranetEndpoint, `${this.region}.aliyuncs.com`);
      assert.equal(result.bucket.IntranetEndpoint, `${this.region}-internal.aliyuncs.com`);
      assert.equal(result.bucket.AccessControlList.Grant, 'private');
      assert.equal(result.bucket.StorageClass, 'Standard');
    });

    it('it should return NoSuchBucketError when bucket not exist', function* () {
      yield utils.throws(function* () {
        yield this.store.getBucketInfo('not-exists-bucket');
      }.bind(this), 'NoSuchBucketError');
    });
  });

  describe('getBucketLoaction', () => {
    it('it should return loaction this.region', function* () {
      const result = yield this.store.getBucketLocation(this.bucket);
      assert.equal(result.location, this.region);
    });

    it('it should return NoSuchBucketError when bucket not exist', function* () {
      yield utils.throws(function* () {
        yield this.store.getBucketLocation('not-exists-bucket');
      }.bind(this), 'NoSuchBucketError');
    });
  });

  describe('deleteBucket()', () => {
    it('should delete not exists bucket throw NoSuchBucketError', function* () {
      yield utils.throws(function* () {
        yield this.store.deleteBucket('not-exists-bucket');
      }.bind(this), 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', function* () {
      this.store.useBucket(this.bucket, this.region);
      yield this.store.put('ali-oss-test-bucket.txt', __filename);
      yield utils.throws(function* () {
        yield this.store.deleteBucket(this.bucket, this.region);
      }.bind(this), 'BucketNotEmptyError');
      yield this.store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', () => {
    it('should set bucket acl to public-read-write', function* () {
      const result = yield this.store.putBucket(this.bucket);
      assert.equal(result.res.status, 200);

      const resultAcl = yield this.store.putBucketACL(this.bucket, this.region, 'public-read-write');
      assert.equal(resultAcl.res.status, 200);
      assert.equal(resultAcl.bucket, this.bucket);

      // Need wait some time for bucket meta sync
      yield utils.sleep(ms(metaSyncTime));

      const r = yield this.store.getBucketACL(this.bucket, this.region);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', function* () {
      const bucket = `${this.bucket}-new`;
      const putresult = yield this.store.putBucketACL(bucket, this.region, 'public-read');
      assert.equal(putresult.res.status, 200);
      assert.equal(putresult.bucket, bucket);

      yield utils.sleep(ms(metaSyncTime));

      const getresult = yield this.store.getBucketACL(bucket);
      assert.equal(getresult.res.status, 200);
      assert.equal(getresult.acl, 'public-read');

      yield this.store.deleteBucket(bucket, this.region);
    });
  });

  describe('listBuckets()', () => {
    before(function* () {
      // create 2 buckets
      this.listBucketsPrefix = `ali-oss-list-buckets-${prefix.replace(/[/.]/g, '-')}`;
      for (let i = 0; i < 2; i++) {
        const name = this.listBucketsPrefix + i;
        const result = yield this.store.putBucket(name);
        assert.equal(result.res.status, 200);
      }
    });

    it('should list buckets by prefix', function* () {
      const result = yield this.store.listBuckets({
        prefix: this.listBucketsPrefix,
        'max-keys': 20,
      });

      assert(Array.isArray(result.buckets));
      assert.equal(result.buckets.length, 2);
      assert(!result.isTruncated);
      assert.equal(result.nextMarker, null);
      assert(result.owner);
      assert.equal(typeof result.owner.id, 'string');
      assert.equal(typeof result.owner.displayName, 'string');

      for (let i = 0; i < 2; i++) {
        const name = this.listBucketsPrefix + i;
        assert.equal(result.buckets[i].name, name);
      }
    });

    /* eslint no-empty: [0] */
    after(function* () {
      for (let i = 0; i < 2; i++) {
        const name = this.listBucketsPrefix + i;
        try {
          yield this.store.deleteBucket(name);
        } catch (err) {}
      }
    });
  });

  describe('putBucketLogging(), getBucketLogging(), deleteBucketLogging()', () => {
    it('should create, get and delete the logging', function* () {
      let result = yield this.store.putBucketLogging(this.bucket, this.region, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = yield this.store.putBucketLogging(this.bucket, this.region, 'logs/');
      assert.equal(result.res.status, 200);

      // get the logging setttings
      result = yield this.store.getBucketLogging(this.bucket, this.region);
      assert.equal(result.res.status, 200);

      // delete it
      result = yield this.store.deleteBucketLogging(this.bucket, this.region);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', () => {
    it('should create, get and delete the website settings', function* () {
      let result = yield this.store.putBucketWebsite(this.bucket, this.region, {
        index: 'index.html',
      });
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = yield this.store.putBucketWebsite(this.bucket, this.region, {
        index: 'index.htm',
        error: 'error.htm',
      });
      assert.equal(result.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      result = yield this.store.getBucketWebsite(this.bucket, this.region);
      assert.equal(typeof result.index, 'string');
      assert.equal(result.res.status, 200);

      // delete it
      result = yield this.store.deleteBucketWebsite(this.bucket, this.region);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketLifecycle(), getBucketLifecycle(), deleteBucketLifecycle()', () => {
    it('should create, get and delete the lifecycle', function* () {
      const putresult1 = yield this.store.putBucketLifecycle(this.bucket, this.region, [{
        id: 'delete after one day',
        prefix: 'logs/',
        status: 'Enabled',
        days: 1,
      }]);
      assert.equal(putresult1.res.status, 200);

      // put again will be fine
      const putresult2 = yield this.store.putBucketLifecycle(this.bucket, this.region, [
        {
          id: 'delete after one day',
          prefix: 'logs/',
          status: 'Enabled',
          days: 1,
        },
        {
          prefix: 'logs2/',
          status: 'Disabled',
          date: '2022-10-11T00:00:00.000Z',
        },
      ]);
      assert.equal(putresult2.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      const putresult3 = yield this.store.getBucketLifecycle(this.bucket, this.region);
      assert(putresult3.rules.length > 0);
      assert.equal(putresult3.res.status, 200);

      // delete it
      const deleteResult = yield this.store.deleteBucketLifecycle(this.bucket, this.region);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', () => {
    it('should create, get and delete the referer', function* () {
      const putresult = yield this.store.putBucketReferer(this.bucket, this.region, true, [
        'http://npm.taobao.org',
      ]);
      assert.equal(putresult.res.status, 200);

      // put again will be fine
      const referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org',
      ];
      const putReferer = yield this.store.putBucketReferer(this.bucket, this.region, false, referers);
      assert.equal(putReferer.res.status, 200);

      yield utils.sleep(ms(metaSyncTime));

      // get
      const getReferer = yield this.store.getBucketReferer(this.bucket, this.region);
      assert(Array.isArray(getReferer.referers));
      assert.equal(typeof getReferer.allowEmpty, 'boolean');
      assert.equal(getReferer.res.status, 200);

      // delete it
      const deleteResult = yield this.store.deleteBucketReferer(this.bucket, this.region);
      assert.equal(deleteResult.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', () => {
    afterEach(function* () {
      // delete it
      const result = yield this.store.deleteBucketCORS(this.bucket, this.region);
      assert.equal(result.res.status, 204);
    });

    it('should create, get and delete the cors', function* () {
      const rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }];
      const putResult = yield this.store.putBucketCORS(this.bucket, this.region, rules);
      assert.equal(putResult.res.status, 200);

      const getResult = yield this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getResult.res.status, 200);
      assert.deepEqual(getResult.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }]);
    });

    it('should overwrite cors', function* () {
      let rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }];
      const putCorsResult1 = yield this.store.putBucketCORS(this.bucket, this.region, rules);
      assert.equal(putCorsResult1.res.status, 200);

      const getCorsResult1 = yield this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getCorsResult1.res.status, 200);
      assert.deepEqual(getCorsResult1.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }]);

      rules = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }];
      const putCorsResult2 = yield this.store.putBucketCORS(this.bucket, this.region, rules);
      assert.equal(putCorsResult2.res.status, 200);

      const getCorsResult2 = yield this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getCorsResult2.res.status, 200);
      assert.deepEqual(getCorsResult2.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }]);
    });

    it('should check rules', function* () {
      try {
        yield this.store.putBucketCORS(this.bucket, this.region);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', function* () {
      try {
        yield this.store.putBucketCORS(this.bucket, this.region, [{}]);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedOrigin is required');
      }
    });

    it('should check allowedMethod', function* () {
      try {
        const rules = [{
          allowedOrigin: '*',
        }];
        yield this.store.putBucketCORS(this.bucket, this.region, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', function* () {
      try {
        yield this.store.getBucketCORS(this.bucket, this.region);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });
});
