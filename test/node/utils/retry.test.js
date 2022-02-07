const assert = require('assert');
const OSS = require('../../..');
const config = require('../../config').oss;
const utils = require('../utils');
const { md5 } = require('utility');
const mm = require('mm');
const fs = require('fs');
const { after } = require('mocha');

describe('test/retry.test.js', () => {
  let store;
  const RETRY_MAX = 3;
  let testRetryCount = 0;
  let autoRestoreWhenRETRY_LIMIE = true;
  const bucket = `ali-oss-test-bucket-retry-${utils.prefix.replace(/[/.]/g, '-').replace(/-$/, '')}`;
  before(async () => {
    store = new OSS({
      ...config,
      retryMax: RETRY_MAX,
      requestErrorRetryHandle: () => {
        testRetryCount++;
        if (testRetryCount === RETRY_MAX && autoRestoreWhenRETRY_LIMIE) {
          mm.restore();
        }
        return true;
      }
    });
    const result = await store.putBucket(bucket);
    assert.strictEqual(result.bucket, bucket);
    assert.strictEqual(result.res.status, 200);
    store.useBucket(bucket);
  });
  beforeEach(() => {
    testRetryCount = 0;
    autoRestoreWhenRETRY_LIMIE = true;
    mm.error(store.urllib, 'request', {
      status: -1, // timeout
      headers: {}
    });
  });
  afterEach(() => {
    mm.restore();
  });
  after(async () => {
    await utils.cleanBucket(store, bucket);
  });

  it('set retryMax to test request auto retry when networkError or timeout', async () => {
    const res = await store.listBuckets();
    assert.strictEqual(res.res.status, 200);
    assert.strictEqual(testRetryCount, RETRY_MAX);
  });

  it('should throw when retry count bigger than options retryMax', async () => {
    autoRestoreWhenRETRY_LIMIE = false;
    try {
      await store.listBuckets();
      assert(false, 'should throw error');
    } catch (error) {
      assert(error.status === -1);
    }
  });

  it('should succeed when put with filename', async () => {
    const name = `ali-oss-test-retry-file-${Date.now()}`;
    const fileName = await utils.createTempFile(name, 1 * 1024);
    const res = await store.put(name, fileName);
    assert.strictEqual(res.res.status, 200);
    assert.strictEqual(testRetryCount, RETRY_MAX);
    const onlineFile = await store.get(name);
    assert.strictEqual(md5(fs.readFileSync(fileName)), md5(onlineFile.content));
  });

  it('should fail when putStream', async () => {
    autoRestoreWhenRETRY_LIMIE = false;
    const name = `ali-oss-test-retry-file-${Date.now()}`;
    const fileName = await utils.createTempFile(name, 1 * 1024);
    try {
      await store.putStream(name, fs.createReadStream(fileName));
      assert(false, 'should not reach here');
    } catch (e) {
      assert.strictEqual(e.status, -1);
    }
  });
});
