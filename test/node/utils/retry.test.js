const assert = require('assert');
const OSS = require('../../..');
const config = require('../../config').oss;
const mm = require('mm');

describe('test/retry.test.js', () => {
  let store;
  const RETRY_MAX = 3;
  let testRetryCount = 0;
  before(() => {
    store = new OSS(config);
    store.options.retryMax = RETRY_MAX;
    store.options.requestErrorRetryHandle = () => {
      testRetryCount++;
      if (testRetryCount === RETRY_MAX) {
        mm.restore();
      }
      return true;
    };
  });
  it('set retryMax to test request auto retry when networkError or timeout', async () => {
    // set retryMax to test request auto retry when networkError or timeout
    mm.error(store.urllib, 'request', {
      status: -1, // timeout
      headers: {}
    });
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
      assert(false);
    } catch (error) {
      assert(error.status === -1);
    }
    mm.restore();
  });
});
