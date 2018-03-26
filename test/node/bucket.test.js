
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

  before(async () => {
    this.store = oss(config);

    const bucketResult = await this.store.listBuckets({
      // prefix: '',
      'max-keys': 20,
    });
    console.log(bucketResult.buckets);

    /* eslint no-restricted-syntax: [0] */
    for (const bucket of bucketResult.buckets) {
      if (bucket.name.startsWith('ali-oss-test-bucket-') || bucket.name.startsWith('ali-oss-list-buckets-')) {
        /* eslint no-await-in-loop: [0] */
        await this.store.deleteBucket(bucket.name);
        console.log('delete %j', bucket);
      }
    }

    this.bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    const result = await this.store.putBucket(this.bucket, this.region);
    assert.equal(result.bucket, this.bucket);
    assert.equal(result.res.status, 200);
  });

  after(async () => {
    await utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('putBucket()', () => {
    before(() => {
      this.name = `ali-oss-test-putbucket-${prefix.replace(/[/.]/g, '-')}`;
      this.name = this.name.substring(0, this.name.length - 1);
    });

    it('should create a new bucket', async () => {
      const result1 = await this.store.putBucket(this.name);
      assert.equal(result1.bucket, this.name);
      assert.equal(result1.res.status, 200);

      // create a exists should work
      const result2 = await this.store.putBucket(this.name);
      assert.equal(result2.res.status, 200);
      assert.equal(result2.bucket, this.name);
    });

    after(async () => {
      const result = await this.store.deleteBucket(this.name);
      assert(result.res.status === 200 || result.res.status === 204);
    });
  });

  describe('deleteBucket()', () => {
    it('should delete not exists bucket throw NoSuchBucketError', async () => {
      await utils.throws(async () => {
        await this.store.deleteBucket('not-exists-bucket');
      }, 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', async () => {
      this.store.useBucket(this.bucket, this.region);
      await this.store.put('ali-oss-test-bucket.txt', __filename);
      await utils.throws(async () => {
        await this.store.deleteBucket(this.bucket, this.region);
      }, 'BucketNotEmptyError');
      await this.store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', () => {
    it('should set bucket acl to public-read-write', async () => {
      const result = await this.store.putBucket(this.bucket);
      assert.equal(result.res.status, 200);

      const resultAcl = await this.store.putBucketACL(this.bucket, this.region, 'public-read-write');
      assert.equal(resultAcl.res.status, 200);
      assert.equal(resultAcl.bucket, this.bucket);

      // Need wait some time for bucket meta sync
      await utils.sleep(ms(metaSyncTime));

      const r = await this.store.getBucketACL(this.bucket, this.region);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', async () => {
      const bucket = `${this.bucket}-new`;
      const putresult = await this.store.putBucketACL(bucket, this.region, 'public-read');
      assert.equal(putresult.res.status, 200);
      assert.equal(putresult.bucket, bucket);

      await utils.sleep(ms(metaSyncTime));

      const getresult = await this.store.getBucketACL(bucket);
      assert.equal(getresult.res.status, 200);
      assert.equal(getresult.acl, 'public-read');

      await this.store.deleteBucket(bucket, this.region);
    });
  });

  describe('listBuckets()', () => {
    before(async () => {
      // create 2 buckets
      this.listBucketsPrefix = `ali-oss-list-buckets-${prefix.replace(/[/.]/g, '-')}`;
      for (let i = 0; i < 2; i++) {
        const name = this.listBucketsPrefix + i;
        const result = await this.store.putBucket(name);
        assert.equal(result.res.status, 200);
      }
    });

    it('should list buckets by prefix', async () => {
      const result = await this.store.listBuckets({
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
    after(async () => {
      for (let i = 0; i < 2; i++) {
        const name = this.listBucketsPrefix + i;
        try {
          await this.store.deleteBucket(name);
        } catch (err) {}
      }
    });
  });

  describe('putBucketLogging(), getBucketLogging(), deleteBucketLogging()', () => {
    it('should create, get and delete the logging', async () => {
      let result = await this.store.putBucketLogging(this.bucket, this.region, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = await this.store.putBucketLogging(this.bucket, this.region, 'logs/');
      assert.equal(result.res.status, 200);

      // get the logging setttings
      result = await this.store.getBucketLogging(this.bucket, this.region);
      assert.equal(result.res.status, 200);

      // delete it
      result = await this.store.deleteBucketLogging(this.bucket, this.region);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', () => {
    it('should create, get and delete the website settings', async () => {
      const result1 = await this.store.putBucketWebsite(this.bucket, this.region, {
        index: 'index.html',
      });
      assert.equal(result1.res.status, 200);
      // put again will be fine
      const result2 = await this.store.putBucketWebsite(this.bucket, this.region, {
        index: 'index.htm',
        error: 'error.htm',
      });
      assert.equal(result2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const get = await this.store.getBucketWebsite(this.bucket, this.region);
      assert.equal(typeof get.index, 'string');
      assert.equal(get.res.status, 200);

      // delete it
      const del = await this.store.deleteBucketWebsite(this.bucket, this.region);
      assert.equal(del.res.status, 204);
    });
  });

  describe('putBucketLifecycle(), getBucketLifecycle(), deleteBucketLifecycle()', () => {
    it('should create, get and delete the lifecycle', async () => {
      const putresult1 = await this.store.putBucketLifecycle(this.bucket, this.region, [{
        id: 'delete after one day',
        prefix: 'logs/',
        status: 'Enabled',
        days: 1,
      }]);
      assert.equal(putresult1.res.status, 200);

      // put again will be fine
      const putresult2 = await this.store.putBucketLifecycle(this.bucket, this.region, [
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

      await utils.sleep(ms(metaSyncTime));

      // get
      const getBucketLifecycle = await this.store.getBucketLifecycle(this.bucket, this.region);
      assert(getBucketLifecycle.rules.length > 0);
      assert.equal(getBucketLifecycle.res.status, 200);

      // delete it
      const deleteResult = await this.store.deleteBucketLifecycle(this.bucket, this.region);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', () => {
    it('should create, get and delete the referer', async () => {
      const putresult = await this.store.putBucketReferer(this.bucket, this.region, true, [
        'http://npm.taobao.org',
      ]);
      assert.equal(putresult.res.status, 200);

      // put again will be fine
      const referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org',
      ];
      const putReferer = await this.store.putBucketReferer(this.bucket, this.region, false, referers);
      assert.equal(putReferer.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const getReferer = await this.store.getBucketReferer(this.bucket, this.region);
      assert(Array.isArray(getReferer.referers));
      assert.equal(typeof getReferer.allowEmpty, 'boolean');
      assert.equal(getReferer.res.status, 200);

      // delete it
      const deleteResult = await this.store.deleteBucketReferer(this.bucket, this.region);
      assert.equal(deleteResult.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', () => {
    afterEach(async () => {
      // delete it
      const result = await this.store.deleteBucketCORS(this.bucket, this.region);
      assert.equal(result.res.status, 204);
    });

    it('should create, get and delete the cors', async () => {
      const rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }];
      const putResult = await this.store.putBucketCORS(this.bucket, this.region, rules);
      assert.equal(putResult.res.status, 200);

      const getResult = await this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getResult.res.status, 200);
      assert.deepEqual(getResult.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30',
      }]);
    });

    it('should overwrite cors', async () => {
      const rules1 = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }];
      const putCorsResult1 = await this.store.putBucketCORS(this.bucket, this.region, rules1);
      assert.equal(putCorsResult1.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult1 = await this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getCorsResult1.res.status, 200);
      assert.deepEqual(getCorsResult1.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }]);

      const rules2 = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }];
      const putCorsResult2 = await this.store.putBucketCORS(this.bucket, this.region, rules2);
      assert.equal(putCorsResult2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult2 = await this.store.getBucketCORS(this.bucket, this.region);
      assert.equal(getCorsResult2.res.status, 200);
      assert.deepEqual(getCorsResult2.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }]);
    });

    it('should check rules', async () => {
      try {
        await this.store.putBucketCORS(this.bucket, this.region);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', async () => {
      try {
        await this.store.putBucketCORS(this.bucket, this.region, [{}]);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedOrigin is required');
      }
    });

    it('should check allowedMethod', async () => {
      try {
        const rules = [{
          allowedOrigin: '*',
        }];
        await this.store.putBucketCORS(this.bucket, this.region, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', async () => {
      try {
        await this.store.getBucketCORS(this.bucket, this.region);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });
});
