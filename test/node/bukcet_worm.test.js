
const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;

describe('test/bucket.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  const defaultRegion = config.region;
  before(async () => {
    store = oss(config);

    const bucketResult = await store.listBuckets({
      'max-keys': 20
    });

    await Promise.all((bucketResult.buckets || [])
      .filter(_ => _.name.startsWith('ali-oss'))
      .map(_bucket => utils
        .cleanBucket(
          oss(Object.assign(config, { region: _bucket.region })),
          _bucket.name
        )));

    config.region = defaultRegion;
    store = oss(config);
    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);

    const result = await store.putBucket(bucket);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket);
  });
  describe('worm()', () => {
    describe('initiateBucketWorm()', () => {
      it('should init bucket worm', async () => {
        try {
          await store.initiateBucketWorm(bucket, '1');
          assert(true);
        } catch (error) {
          assert(false, error);
        }
      });
    });
    describe('abortBucketWorm()', () => {
      it('should abort bucket worm', async () => {
        try {
          await store.abortBucketWorm(bucket);
          assert(true);
        } catch (error) {
          assert(false, error);
        }
      });
    });
    describe('completeBucketWorm(), getBucketWorm()', () => {
      it('should complete bucket worm', async () => {
        const { wormId } = await store.initiateBucketWorm(bucket, '1');
        try {
          await store.completeBucketWorm(bucket, wormId);
          assert(true);
        } catch (error) {
          assert(false, error);
        }

        try {
          const result = await store.getBucketWorm(bucket);
          assert(result.wormId);
        } catch (error) {
          assert(false, error);
        }
      });
    });
    describe('extendBucketWorm()', () => {
      it('should extend bucket worm', async () => {
        try {
          const { wormId, days } = await store.getBucketWorm(bucket);
          await store.extendBucketWorm(
            bucket,
            wormId,
            (days * 1 + 1).toString()
          );
          const result = await store.getBucketWorm(bucket);
          assert(result.days - days === 1);
        } catch (error) {
          assert(false, error);
        }
      });
    });
  });

});
