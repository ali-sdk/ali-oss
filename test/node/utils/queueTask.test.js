const assert = require('assert');
const config = require('../../config').oss;
const utils = require('../utils');
const OSS = require('../../../lib/node');

describe('utils/queueTask', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  let bucketRegion;
  before(async () => {
    bucket = `ali-oss-test-queue-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    store = new OSS(config);
    bucketRegion = config.region;

    await store.putBucket(bucket);
    store.useBucket(bucket, bucketRegion);
  });
  after(() => {
    utils.cleanAllBucket(store);
  });

  it('put()', async () => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      list.push([
        `put-test-${i}`,
        Buffer.from(
          Array(1024 * 1024 * 2)
            .fill('a')
            .join('')
        )
      ]);
    }
    const result = await store.queueTask(list, store.put);
    assert.equal(result.errorList.length, 0);
    assert.equal(result.sucessList.length, 10);
    const uploadObject = await store.list();
    assert.equal(uploadObject.objects.length, 10);
  });
  it('multipartUpload()', async () => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      list.push([
        `multipart-test-${i}`,
        Buffer.from(
          Array(1024 * 1024 * 3)
            .fill('a')
            .join('')
        )
      ]);
    }
    const result = await store.queueTask(list, store.multipartUpload);
    assert.equal(result.errorList.length, 0);
    assert.equal(result.sucessList.length, 10);
    const uploadObject = await store.list();
    assert.equal(uploadObject.objects.length, 20);
  });

  it('catch error', async () => {
    const list = [
      [
        'object-1',
        Buffer.from(
          Array(1024 * 1024 * 2)
            .fill('a')
            .join('')
        )
      ],
      [
        'object-2',
        Buffer.from(
          Array(1024 * 1024 * 2)
            .fill('a')
            .join('')
        )
      ],
      ['error-1', 'error']
    ];
    const result = await store.queueTask(list, store.put);
    assert.equal(result.sucessList.length, 2);
    assert.equal(result.errorList.length, 1);
  });

  it('threads exceeded limit', async () => {
    try {
      store.queueTask(['list', './tmp'], store.put, { limit: 11 });
    } catch (e) {
      assert.equal(e.toString(), 'Error: no more than 10 threads');
    }
  });
});
