
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
      'max-keys': 20
    });

    /* eslint no-restricted-syntax: [0] */
    for (const bucketObj of bucketResult.buckets) {
      if (bucketObj.name.startsWith('ali-oss-test-bucket-') || bucketObj.name.startsWith('ali-oss-list-buckets-')) {
        /* eslint no-await-in-loop: [0] */
        await store.deleteBucket(bucketObj.name);
      }
    }

    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    bucketRegion = config.region;

    const result = await store.putBucket(bucket);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket);
  });

  describe('setBucket()', () => {
    it('should check bucket name', async () => {
      try {
        const name = 'ali-oss-test-bucket-/';
        await store.setBucket(name);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The bucket must be conform to the specifications');
      }
    });
  });

  describe('getBucket()', () => {
    it('should get bucket name', async () => {
      const name = 'ali-oss-test-bucket';
      await store.setBucket(name);
      const res = store.getBucket();
      assert.equal(res, name);
    });
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
      await store.putBucket(archvieBucket, { StorageClass: 'Archive' });
    });

    it('should create a new bucket', async () => {
      const result1 = await store.putBucket(name);
      assert.equal(result1.bucket, name);
      assert.equal(result1.res.status, 200);
    });

    it('should create an archive bucket', async () => {
      await utils.sleep(ms(metaSyncTime));
      const result2 = await store.listBuckets();
      const { buckets } = result2;
      const m = buckets.some(item => item.name === archvieBucket);
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

  describe('getBucketInfo', () => {
    it('it should return correct bucketInfo when bucket exist', async () => {
      const result = await store.getBucketInfo(bucket);
      assert.equal(result.res.status, 200);

      assert.equal(result.bucket.Location, `${bucketRegion}`);
      assert.equal(result.bucket.ExtranetEndpoint, `${bucketRegion}.aliyuncs.com`);
      assert.equal(result.bucket.IntranetEndpoint, `${bucketRegion}-internal.aliyuncs.com`);
      assert.equal(result.bucket.AccessControlList.Grant, 'private');
      assert.equal(result.bucket.StorageClass, 'Standard');
    });

    it('it should return NoSuchBucketError when bucket not exist', async () => {
      await utils.throws(async () => {
        await store.getBucketInfo('not-exists-bucket');
      }, 'NoSuchBucketError');
    });
  });

  describe('getBucketLoaction', () => {
    it('it should return loaction this.region', async () => {
      const result = await store.getBucketLocation(bucket);
      assert.equal(result.location, bucketRegion);
    });

    it('it should return NoSuchBucketError when bucket not exist', async () => {
      await utils.throws(async () => {
        await store.getBucketLocation('not-exists-bucket');
      }, 'NoSuchBucketError');
    });
  });

  describe('deleteBucket()', () => {
    it('should delete not exists bucket throw NoSuchBucketError', async () => {
      await utils.throws(async () => {
        await store.deleteBucket('not-exists-bucket');
      }, 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', async () => {
      store.useBucket(bucket);
      await store.put('ali-oss-test-bucket.txt', __filename);
      await utils.throws(async () => {
        await store.deleteBucket(bucket);
      }, 'BucketNotEmptyError');
      await store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', () => {
    it('should set bucket acl to public-read-write', async () => {
      const result = await store.putBucket(bucket);
      assert.equal(result.res.status, 200);

      const resultAcl = await store.putBucketACL(bucket, 'public-read-write');
      assert.equal(resultAcl.res.status, 200);
      assert.equal(resultAcl.bucket, bucket);

      // Need wait some time for bucket meta sync
      await utils.sleep(ms(metaSyncTime));

      const r = await store.getBucketACL(bucket);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', async () => {
      const bucketacl = `${bucket}-new`;
      const putresult = await store.putBucketACL(bucketacl, 'public-read');
      assert.equal(putresult.res.status, 200);
      assert.equal(putresult.bucket, bucketacl);

      await utils.sleep(ms(metaSyncTime));

      const getresult = await store.getBucketACL(bucketacl);
      assert.equal(getresult.res.status, 200);
      assert.equal(getresult.acl, 'public-read');

      await store.deleteBucket(bucketacl);
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
        'max-keys': 20
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
      let result = await store.putBucketLogging(bucket, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = await store.putBucketLogging(bucket, 'logs/');
      assert.equal(result.res.status, 200);

      // get the logging setttings
      result = await store.getBucketLogging(bucket);
      assert.equal(result.res.status, 200);

      // delete it
      result = await store.deleteBucketLogging(bucket);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', () => {
    it('should create, get and delete the website settings', async () => {
      const result1 = await store.putBucketWebsite(bucket, {
        index: 'index.html'
      });
      assert.equal(result1.res.status, 200);
      // put again will be fine
      const result2 = await store.putBucketWebsite(bucket, {
        index: 'index.htm',
        error: 'error.htm'
      });
      assert.equal(result2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const get = await store.getBucketWebsite(bucket);
      assert.equal(typeof get.index, 'string');
      assert.equal(get.res.status, 200);

      // delete it
      const del = await store.deleteBucketWebsite(bucket);
      assert.equal(del.res.status, 204);
    });
  });

  describe('putBucketLifecycle(), getBucketLifecycle(), deleteBucketLifecycle()', () => {
    it('should create, get and delete the lifecycle', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'delete after one day',
        prefix: 'logs/',
        status: 'Enabled',
        days: 1
      }]);
      assert.equal(putresult1.res.status, 200);

      // put again will be fine
      const putresult2 = await store.putBucketLifecycle(bucket, [
        {
          id: 'delete after one day',
          prefix: 'logs/',
          status: 'Enabled',
          days: 1
        },
        {
          prefix: 'logs2/',
          status: 'Disabled',
          date: '2022-10-11T00:00:00.000Z'
        }
      ]);
      assert.equal(putresult2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const getBucketLifecycle = await store.getBucketLifecycle(bucket);
      assert(getBucketLifecycle.rules.length > 0);
      assert.equal(getBucketLifecycle.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketLifecycle(bucket);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', () => {
    it('should create, get and delete the referer', async () => {
      const putresult = await store.putBucketReferer(bucket, true, [
        'http://npm.taobao.org'
      ]);
      assert.equal(putresult.res.status, 200);

      // put again will be fine
      const referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org'
      ];
      const putReferer = await store.putBucketReferer(bucket, false, referers);
      assert.equal(putReferer.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const getReferer = await store.getBucketReferer(bucket);
      assert(Array.isArray(getReferer.referers));
      assert.equal(typeof getReferer.allowEmpty, 'boolean');
      assert.equal(getReferer.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketReferer(bucket);
      assert.equal(deleteResult.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', () => {
    afterEach(async () => {
      // delete it
      const result = await store.deleteBucketCORS(bucket);
      assert.equal(result.res.status, 204);
    });

    it('should create, get and delete the cors', async () => {
      const rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30'
      }];
      const putResult = await store.putBucketCORS(bucket, rules);
      assert.equal(putResult.res.status, 200);

      const getResult = await store.getBucketCORS(bucket);
      assert.equal(getResult.res.status, 200);
      assert.deepEqual(getResult.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30'
      }]);
    });

    it('should overwrite cors', async () => {
      const rules1 = [{
        allowedOrigin: '*',
        allowedMethod: 'GET'
      }];
      const putCorsResult1 = await store.putBucketCORS(bucket, rules1);
      assert.equal(putCorsResult1.res.status, 200);

      await utils.sleep(ms('1000ms'));

      const getCorsResult1 = await store.getBucketCORS(bucket);
      assert.equal(getCorsResult1.res.status, 200);
      assert.deepEqual(getCorsResult1.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET'
      }]);

      const rules2 = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD'
      }];
      const putCorsResult2 = await store.putBucketCORS(bucket, rules2);
      assert.equal(putCorsResult2.res.status, 200);

      await utils.sleep(ms('1000ms'));

      const getCorsResult2 = await store.getBucketCORS(bucket);
      assert.equal(getCorsResult2.res.status, 200);
      assert.deepEqual(getCorsResult2.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD'
      }]);
    });

    it('should check rules', async () => {
      try {
        await store.putBucketCORS(bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', async () => {
      try {
        await store.putBucketCORS(bucket, [{}]);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedOrigin is required');
      }
    });

    it('should check allowedMethod', async () => {
      try {
        const rules = [{
          allowedOrigin: '*'
        }];
        await store.putBucketCORS(bucket, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', async () => {
      try {
        await store.getBucketCORS(bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });

  describe('putBucketRequestPayment(), getBucketRequestPayment()', () => {
    it('should create, get the request payment', async () => {
      try {
        await store.putBucketRequestPayment(bucket, 'Requester');
        const result = await store.getBucketRequestPayment(bucket);
        assert(result.payer === 'Requester', 'payer should be Requester');
      } catch (err) {
        assert(false);
      }
    });

    it('should throw error when payer is not BucketOwner or Requester', async () => {
      try {
        await store.putBucketRequestPayment(bucket, 'requester');
      } catch (err) {
        assert(err.message.includes('payer must be BucketOwner or Requester'));
      }
    });
  });

  describe('getBucketTags() putBucketTags() deleteBucketTags()', () => {
    it('should get the tags of bucket', async () => {
      try {
        const result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });

    it('should configures or updates the tags of bucket', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        result = await store.putBucketTags(bucket, tag);
        assert.strictEqual(result.status, 200);

        result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }
    });

    it('maximum of 20 tags for a bucket', async () => {
      try {
        const tag = {};
        Array(21).fill(1).forEach((_, index) => {
          tag[index] = index;
        });
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('maximum of 20 tags for a bucket', error.message);
      }
    });

    it('tag key can be a maximum of 64 bytes in length', async () => {
      try {
        const key = new Array(65).fill('1').join('');
        const tag = { [key]: '1' };

        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('tag key can be a maximum of 64 bytes in length', error.message);
      }
    });

    it('tag value can be a maximum of 128 bytes in length', async () => {
      try {
        const value = new Array(129).fill('1').join('');
        const tag = { a: value };

        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('tag value can be a maximum of 128 bytes in length', error.message);
      }
    });

    it('should throw error when the type of tag is not Object', async () => {
      try {
        const tag = [{ a: 1 }];
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert(error.message.includes('tag must be Object'));
      }
    });

    it('should throw error when the type of tag value is number', async () => {
      try {
        const tag = { a: 1 };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Object', async () => {
      try {
        const tag = { a: { inner: '1' } };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Array', async () => {
      try {
        const tag = { a: ['1', '2'] };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should delete the tags of bucket', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        await store.putBucketTags(bucket, tag);

        result = await store.deleteBucketTags(bucket);
        assert.strictEqual(result.status, 204);

        result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });
  });
  describe('putBucketEncryption(), getBucketEncryption(), deleteBucketEncryption()', () => {
    it('should create, get and delete the bucket encryption', async () => {
      // put with AES256
      const putresult1 = await store.putBucketEncryption(bucket, {
        SSEAlgorithm: 'AES256'
      });
      assert.equal(putresult1.res.status, 200);
      // put again with KMS will be fine
      // const putresult2 = await store.putBucketEncryption(bucket, {
      //   SSEAlgorithm: 'KMS',
      //   KMSMasterKeyID: '1b2c3132-b2ce-4ba3-a4dd-9885904099ad'
      // });
      // assert.equal(putresult2.res.status, 200);
      // await utils.sleep(ms(metaSyncTime));
      // get
      const getBucketEncryption = await store.getBucketEncryption(bucket);
      assert.equal(getBucketEncryption.res.status, 200);
      assert.deepEqual(getBucketEncryption.encryption, {
        SSEAlgorithm: 'AES256'
        // KMSMasterKeyID: '1b2c3132-b2ce-4ba3-a4dd-9885904099ad'
      });
      // delete
      const deleteResult = await store.deleteBucketEncryption(bucket);
      assert.equal(deleteResult.res.status, 204);
    });
  });
});
