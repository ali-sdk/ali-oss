const assert = require('assert');
const OSS = require('../../..');
const config = require('../../config').oss;
const mm = require('mm');

describe('test/retry.test.js', () => {
  let store;
  before(async () => {
    store = new OSS(config);
  });
  it('set retryMax to test request auto retry when networkError or timeout', async () => {
    const RETRY_MAX = 3;
    // set retryMax to test request auto retry when networkError or timeout
    let testRetryCount = 0;
    store.options.retryMax = RETRY_MAX;
    store.options.requestErrorRetryHandle = () => {
      testRetryCount++;
      if (testRetryCount === RETRY_MAX) {
        mm.restore();
      }
      return true;
    };

    mm.error(store.urllib, 'request', {
      status: -1, // timeout
      headers: {}
    });
    const res = await store.listBuckets();
    assert.strictEqual(res.res.status, 200);

    assert.strictEqual(testRetryCount, testRetryCount);
  });
});
