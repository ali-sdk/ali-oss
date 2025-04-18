const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const { oss: config, conditions, timeout } = require('../config');

describe('test/bucket_worm.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  conditions.forEach((moreConfigs, index) => {
    describe(`test worm in iterate ${index}`, () => {
      before(function () {
        if (config.cloudBoxId) this.skip(); // 云盒暂不支持worm
      });
      before(async () => {
        store = oss({ ...config, ...moreConfigs });
        bucket = `ali-oss-test-worm-bucket-worm-${prefix.replace(/[/.]/g, '-')}${index}`;

        const result = await store.putBucket(bucket, { timeout });
        assert.equal(result.bucket, bucket);
        assert.equal(result.res.status, 200);
      });

      // github CI will remove buckets
      // restore object will have cache
      // after(async () => {
      //   await utils.cleanBucket(store, bucket);
      // });

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
            await store.extendBucketWorm(bucket, wormId, (days * 1 + 1).toString());
            const result = await store.getBucketWorm(bucket);
            assert(result.days - days === 1);
          } catch (error) {
            assert(false, error);
          }
        });
      });
    });
  });
});
