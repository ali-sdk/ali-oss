
const assert = require('assert');
const utils = require('./utils');
const OSS = require('../..');
const ms = require('humanize-ms');
const config = require('../config').oss;
const { timeout, metaSyncTime } = require('../config');

describe('test/bucket.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  const defaultRegion = config.region;
  before(async () => {
    store = new OSS(config);
    config.region = defaultRegion;
    store = new OSS(config);
    bucket = `ali-oss-test-worm2-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);

    const result = await store.putBucket(bucket, { timeout });
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);
  });

  // github CI will remove buckets
  // restore object will have cache
  // after(async () => {
  //   await utils.cleanAllBucket(store);
  // });

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
        utils.sleep(ms(metaSyncTime));
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
          utils.sleep(ms(metaSyncTime));
          const result = await store.getBucketWorm(bucket);
          assert(result.days - days === 1);
        } catch (error) {
          assert(false, error);
        }
      });
    });
  });

});
