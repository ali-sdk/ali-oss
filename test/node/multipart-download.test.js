const fs = require('fs');
const assert = require('assert');
const utils = require('./utils');
const OSS = require('../..');
const config = require('../config').oss;
const { md5 } = require('utility');

describe.only('multipart-download.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  let bucketRegion;
  before(async () => {
    store = new OSS(config);
    bucket = `ali-oss-test-multipart-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    bucketRegion = config.region;

    await store.putBucket(bucket, bucketRegion);
    store.useBucket(bucket, bucketRegion);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket);
  });

  it('should multipartDownload', async () => {
    const fileName = await utils.createTempFile('multipart-download-0', 1024 * 1024 * 2.5);
    const localFileName = '/tmp/.oss/local-multipart-download';
    const name = 'multipart-download-test';
    await store.multipartUpload(name, fileName);
    await store.multipartDownload(name, localFileName);
    assert.strictEqual(md5(fs.readFileSync(fileName)), md5(fs.readFileSync(localFileName)));
  });

  it('should multipartDownload after cancel and resume', async () => {
    const fileName = await utils.createTempFile('multipart-download-1', 1024 * 1024 * 20);
    const localFileName = '/tmp/.oss/local-multipart-download-1';
    const name = 'multipart-download-test-1';
    await store.multipartUpload(name, fileName);
    let cancel;
    let hasCanceled = false;
    const upload = () => {
      return store.multipartDownload(name, localFileName, {
        ref: actions => {
          cancel = actions.cancel;
          if (!hasCanceled) {
            setTimeout(() => {
              hasCanceled = true;
              cancel();
            }, 100);
          }
        }
      });
    };
    await upload()
      .catch(e => {
        assert.strictEqual(e.name, 'cancel');
        return upload();
      })
      .then(() => {
        assert.strictEqual(md5(fs.readFileSync(fileName)), md5(fs.readFileSync(localFileName)));
      });
  });
});
