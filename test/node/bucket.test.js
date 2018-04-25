
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
  let store;
  let bucket;
  let bucketRegion;
  before(async () => {
    store = oss(config);

    const bucketResult = await store.listBuckets({
      // prefix: '',
      'max-keys': 20,
    });
    console.log(bucketResult.buckets);

    /* eslint no-restricted-syntax: [0] */
    for (const bucketObj of bucketResult.buckets) {
      if (bucketObj.name.startsWith('ali-oss-test-bucket-') || bucketObj.name.startsWith('ali-oss-list-buckets-')) {
        /* eslint no-await-in-loop: [0] */
        await store.deleteBucket(bucketObj.name);
        console.log('delete %j', bucketObj);
      }
    }

    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    bucketRegion = config.region;

    const result = await store.putBucket(bucket, bucketRegion);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket, bucketRegion);
  });

  describe('putBucket()', () => {
    let name;
    let archvieBucket;
    before(async () => {
      name = `ali-oss-test-putbucket-${prefix.replace(/[/.]/g, '-')}`;
      name = name.substring(0, name.length - 1);
      // just for archive bucket test
      archvieBucket = `ali-oss-archive-bucket-${prefix.replace(/[/.]/g, '-')}`;
      archvieBucket = archvieBucket.substring(0, archvieBucket.length - 1);
      await store.putBucket(archvieBucket, bucketRegion, { StorageClass: 'Archive' });
    });

    it('should create a new bucket', async () => {
      const result1 = await store.putBucket(name);
      assert.equal(result1.bucket, name);
      assert.equal(result1.res.status, 200);

      // create a exists should work
      const result2 = await store.putBucket(name);
      assert.equal(result2.res.status, 200);
      assert.equal(result2.bucket, name);
    });

    it('should create an archive bucket', async () => {
      await utils.sleep(ms(metaSyncTime));
      const result2 = await store.listBuckets();
      const { buckets } = result2;
      const m = buckets.some(item => item.name === archvieBucket);
      console.log(buckets);
      assert(m === true);
      buckets.map((item) => {
        if (item.name === archvieBucket) {
          assert(item.StorageClass === 'Archive');
        }
        return 1;
      });
    });

    after(async () => {
      const result = await store.deleteBucket(name);
      assert(result.res.status === 200 || result.res.status === 204);
      await store.deleteBucket(archvieBucket);
    });
  });

  describe('deleteBucket()', () => {
    it('should delete not exists bucket throw NoSuchBucketError', async () => {
      await utils.throws(async () => {
        await store.deleteBucket('not-exists-bucket');
      }, 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', async () => {
      store.useBucket(bucket, bucketRegion);
      await store.put('ali-oss-test-bucket.txt', __filename);
      await utils.throws(async () => {
        await store.deleteBucket(bucket, bucketRegion);
      }, 'BucketNotEmptyError');
      await store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', () => {
    it('should set bucket acl to public-read-write', async () => {
      const result = await store.putBucket(bucket);
      assert.equal(result.res.status, 200);

      const resultAcl = await store.putBucketACL(bucket, bucketRegion, 'public-read-write');
      assert.equal(resultAcl.res.status, 200);
      assert.equal(resultAcl.bucket, bucket);

      // Need wait some time for bucket meta sync
      await utils.sleep(ms(metaSyncTime));

      const r = await store.getBucketACL(bucket, bucketRegion);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', async () => {
      const bucketacl = `${bucket}-new`;
      const putresult = await store.putBucketACL(bucketacl, bucketRegion, 'public-read');
      assert.equal(putresult.res.status, 200);
      assert.equal(putresult.bucket, bucketacl);

      await utils.sleep(ms(metaSyncTime));

      const getresult = await store.getBucketACL(bucketacl);
      assert.equal(getresult.res.status, 200);
      assert.equal(getresult.acl, 'public-read');

      await store.deleteBucket(bucketacl, bucketRegion);
    });
  });

  describe('listBuckets()', () => {
    let listBucketsPrefix;
    before(async () => {
      // create 2 buckets
      listBucketsPrefix = `ali-oss-list-buckets-${prefix.replace(/[/.]/g, '-')}`;
      for (let i = 0; i < 2; i++) {
        const name = listBucketsPrefix + i;
        const result = await store.putBucket(name);
        assert.equal(result.res.status, 200);
      }
    });

    it('should list buckets by prefix', async () => {
      const result = await store.listBuckets({
        prefix: listBucketsPrefix,
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
        const name = listBucketsPrefix + i;
        assert.equal(result.buckets[i].name, name);
      }
    });

    /* eslint no-empty: [0] */
    after(async () => {
      for (let i = 0; i < 2; i++) {
        const name = listBucketsPrefix + i;
        try {
          await store.deleteBucket(name);
        } catch (err) {}
      }
    });
  });

  describe('putBucketLogging(), getBucketLogging(), deleteBucketLogging()', () => {
    it('should create, get and delete the logging', async () => {
      let result = await store.putBucketLogging(bucket, bucketRegion, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = await store.putBucketLogging(bucket, bucketRegion, 'logs/');
      assert.equal(result.res.status, 200);

      // get the logging setttings
      result = await store.getBucketLogging(bucket, bucketRegion);
      assert.equal(result.res.status, 200);

      // delete it
      result = await store.deleteBucketLogging(bucket, bucketRegion);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', () => {
    it('should create, get and delete the website settings', async () => {
      const result1 = await store.putBucketWebsite(bucket, bucketRegion, {
        index: 'index.html',
      });
      assert.equal(result1.res.status, 200);
      // put again will be fine
      const result2 = await store.putBucketWebsite(bucket, bucketRegion, {
        index: 'index.htm',
        error: 'error.htm',
      });
      assert.equal(result2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const get = await store.getBucketWebsite(bucket, bucketRegion);
      assert.equal(typeof get.index, 'string');
      assert.equal(get.res.status, 200);

      // delete it
      const del = await store.deleteBucketWebsite(bucket, bucketRegion);
      assert.equal(del.res.status, 204);
    });
  });

  describe('putBucketLifecycle(), getBucketLifecycle(), deleteBucketLifecycle()', () => {
    it('should create, get and delete the lifecycle', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, bucketRegion, [{
        id: 'delete after one day',
        prefix: 'logs/',
        status: 'Enabled',
        days: 1,
      }]);
      assert.equal(putresult1.res.status, 200);

      // put again will be fine
      const putresult2 = await store.putBucketLifecycle(bucket, bucketRegion, [
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
      const getBucketLifecycle = await store.getBucketLifecycle(bucket, bucketRegion);
      assert(getBucketLifecycle.rules.length > 0);
      assert.equal(getBucketLifecycle.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketLifecycle(bucket, bucketRegion);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', () => {
    it('should create, get and delete the referer', async () => {
      const putresult = await store.putBucketReferer(bucket, bucketRegion, true, [
        'http://npm.taobao.org',
      ]);
      assert.equal(putresult.res.status, 200);

      // put again will be fine
      const referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org',
      ];
      const putReferer = await store.putBucketReferer(bucket, bucketRegion, false, referers);
      assert.equal(putReferer.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const getReferer = await store.getBucketReferer(bucket, bucketRegion);
      assert(Array.isArray(getReferer.referers));
      assert.equal(typeof getReferer.allowEmpty, 'boolean');
      assert.equal(getReferer.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketReferer(bucket, bucketRegion);
      assert.equal(deleteResult.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', () => {
    afterEach(async () => {
      // delete it
      const result = await store.deleteBucketCORS(bucket, bucketRegion);
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
      const putResult = await store.putBucketCORS(bucket, bucketRegion, rules);
      assert.equal(putResult.res.status, 200);

      const getResult = await store.getBucketCORS(bucket, bucketRegion);
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
      const putCorsResult1 = await store.putBucketCORS(bucket, bucketRegion, rules1);
      assert.equal(putCorsResult1.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult1 = await store.getBucketCORS(bucket, bucketRegion);
      assert.equal(getCorsResult1.res.status, 200);
      assert.deepEqual(getCorsResult1.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
      }]);

      const rules2 = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }];
      const putCorsResult2 = await store.putBucketCORS(bucket, bucketRegion, rules2);
      assert.equal(putCorsResult2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult2 = await store.getBucketCORS(bucket, bucketRegion);
      assert.equal(getCorsResult2.res.status, 200);
      assert.deepEqual(getCorsResult2.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD',
      }]);
    });

    it('should check rules', async () => {
      try {
        await store.putBucketCORS(bucket, bucketRegion);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', async () => {
      try {
        await store.putBucketCORS(bucket, bucketRegion, [{}]);
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
        await store.putBucketCORS(bucket, bucketRegion, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', async () => {
      try {
        await store.getBucketCORS(bucket, bucketRegion);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });
});
