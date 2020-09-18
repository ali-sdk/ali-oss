const dns = require('dns');
const assert = require('assert');
const utils = require('./utils');
const oss = require('../../lib/client');
const config = require('../config').oss;

async function getIP(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

describe('test/endpoint.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  before(async () => {
    store = oss(config);
    bucket = `ali-oss-test-object-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);

    await store.putBucket(bucket);
    const endpoint = await getIP(`${bucket}.${store.options.endpoint.hostname}`);
    const testEndponitConfig = Object.assign({}, config, {
      cname: true,
      endpoint
    });
    store = oss(testEndponitConfig);
    store.useBucket(bucket);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket);
  });

  describe('endpoint is ip', () => {
    it('should put and get', async () => {
      try {
        const name = `${prefix}ali-sdk/oss/putWidhIP.js`;
        const object = await store.put(name, __filename);
        assert(object.name, name);

        const result = await store.get(name);
        assert(result.res.status, 200);
      } catch (error) {
        assert(false, error.message);
      }
    });
  });
});
