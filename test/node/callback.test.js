
const fs = require('fs');
const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;
const { callbackServer } = require('../const');
const mm = require('mm');

describe('test/multipart.test.js', () => {
  const { prefix } = utils;

  before(function* () {
    this.store = oss(config);
    this.bucket = `ali-oss-test-callback-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    yield this.store.putBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });


  describe('upload callback', () => {
    afterEach(mm.restore);
    // callback server on EC2, maybe fail on China, bug pass on travis ci
    // callback server down, skip it
    it('should multipart upload parse response with callback', function* () {
      // create a file with 1M random data
      const fileName = yield utils.createTempFile('upload-with-callback', 1024 * 1024);

      const name = `${prefix}multipart/upload-with-callback`;
      const result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        callback: {
          url: callbackServer,
          host: 'oss-cn-hangzhou.aliyuncs.com',
          /* eslint no-template-curly-in-string: [0] */
          body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
          contentType: 'application/x-www-form-urlencoded',
          customValue: {
            var1: 'value1',
            var2: 'value2',
          },
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should multipart upload copy with callback', function* () {
      const fileName = yield utils.createTempFile('multipart-upload-file-copy-callback', 2 * 1024 * 1024);
      const name = `${prefix}multipart/upload-file-with-copy-callback`;
      yield this.store.multipartUpload(name, fileName);

      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-new-callback`;
      const result = yield client.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket,
      }, {
        partSize: 256 * 1024,
        callback: {
          url: callbackServer,
          host: 'oss-cn-hangzhou.aliyuncs.com',
          body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
          contentType: 'application/x-www-form-urlencoded',
          customValue: {
            var1: 'value1',
            var2: 'value2',
          },
        },
        copyheaders: {
          'x-oss-copy-source-if-match': '',
        },
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should multipart upload with no more 100k file parse response with callback', function* () {
      // create a file with 1M random data
      const fileName = yield utils.createTempFile('upload-with-callback', 50 * 1024);

      const name = `${prefix}multipart/upload-with-callback`;
      const result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        callback: {
          url: callbackServer,
          host: 'oss-cn-hangzhou.aliyuncs.com',
          body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
          contentType: 'application/x-www-form-urlencoded',
          customValue: {
            var1: 'value1',
            var2: 'value2',
          },
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should putStream parse response with callback', function* () {
      const name = `${prefix}ali-sdk/oss/putstream-callback.js`;
      const result = yield this.store.putStream(name, fs.createReadStream(__filename), {
        callback: {
          url: callbackServer,
          host: 'oss-cn-hangzhou.aliyuncs.com',
          body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
          contentType: 'application/x-www-form-urlencoded',
          customValue: {
            var1: 'value1',
            var2: 'value2',
          },
        },
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should put parse response with callback', function* () {
      const name = `${prefix}ali-sdk/oss/put-callback.js`;
      const result = yield this.store.put(name, __filename, {
        callback: {
          url: callbackServer,
          host: 'oss-cn-hangzhou.aliyuncs.com',
          body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
          contentType: 'application/x-www-form-urlencoded',
          customValue: {
            var1: 'value1',
            var2: 'value2',
          },
        },
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });
  });
});
