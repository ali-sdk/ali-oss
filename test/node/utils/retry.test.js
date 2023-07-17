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
  const bucket = `ali-oss-test-retry-bucket-${utils.prefix.replace(/[/.]/g, '-').replace(/-$/, '')}`;
  before(async () => {
    store = new OSS({
      ...config,
      retryMax: RETRY_MAX
    });
    const result = await store.putBucket(bucket);
    assert.strictEqual(result.bucket, bucket);
    assert.strictEqual(result.res.status, 200);
    store.useBucket(bucket);
  });
  beforeEach(() => {
    testRetryCount = 0;
    const originRequest = store.urllib.request;
    mm(store.urllib, 'request', async (url, params) => {
      if (testRetryCount < RETRY_MAX) {
        testRetryCount++;
        const e = new Error('net error');
        e.status = -1;
        e.headers = {};
        throw e;
      } else {
        return await originRequest(url, params);
      }
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
    mm.error(store.urllib, 'request', {
      status: -1, // timeout
      headers: {}
    });
    try {
      await store.listBuckets();
      assert(false, 'should throw error');
    } catch (error) {
      assert(error.status === -1);
    }
  });

  it('should not retry when err.status is not -1 or -2', async () => {
    mm.error(store.urllib, 'request', {
      status: -3,
      headers: {}
    });
    try {
      const name = `ali-oss-test-retry-file-${Date.now()}`;
      const fileName = await utils.createTempFile(name, 1 * 1024);
      await store.put(name, fileName);
      assert(false, 'should throw error');
    } catch (error) {
      assert.strictEqual(error.status, -3);
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

  it('should succeed when multipartUpload with filename', async () => {
    mm.restore();
    const originRequest = store.urllib.request;
    const UPLOAD_PART_SEQ = 1;
    let CurrentRequsetTimer = 0;
    mm(store.urllib, 'request', async (url, params) => {
      // skip mock when initMultipartUpload
      if (CurrentRequsetTimer < UPLOAD_PART_SEQ) {
        CurrentRequsetTimer++;
        return originRequest(url, params);
      }
      // mock net error when upload part
      if (testRetryCount < RETRY_MAX) {
        testRetryCount++;
        const e = new Error('net error');
        e.status = -1;
        e.headers = {};
        throw e;
      } else {
        return originRequest(url, params);
      }
    });
    const name = `ali-oss-test-retry-file-${Date.now()}`;
    const fileName = await utils.createTempFile(name, 1.5 * 1024 * 1024);
    const res = await store.multipartUpload(name, fileName);
    assert.strictEqual(res.res.status, 200);
    assert.strictEqual(testRetryCount, RETRY_MAX);
    const onlineFile = await store.get(name);
    assert.strictEqual(onlineFile.content.length, 1.5 * 1024 * 1024);
    assert.strictEqual(md5(fs.readFileSync(fileName)), md5(onlineFile.content));
  });

  it('should fail when put with stream', async () => {
    const name = `ali-oss-test-retry-file-${Date.now()}`;
    const fileName = await utils.createTempFile(name, 1 * 1024);
    try {
      await store.put(name, fs.createReadStream(fileName));
      assert(false, 'should not reach here');
    } catch (e) {
      assert.strictEqual(e.status, -1);
    }
  });
});
