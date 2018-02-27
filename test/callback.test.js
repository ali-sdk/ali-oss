'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var cfs = require('co-fs');
var utils = require('./utils');
var oss = require('../');
var config = require('./config').oss;
var urllib = require('urllib');
var copy = require('copy-to');
var md5 = require('utility').md5;
var mm = require('mm');
var sinon = require('sinon');

describe('test/multipart.test.js', function () {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);
    this.bucket = 'ali-oss-test-multipart-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    yield this.store.putBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });


  describe('upload callback', function () {
    afterEach(mm.restore);
    // callback server on EC2, maybe fail on China, bug pass on travis ci
    // callback server down, skip it
    it('should multipart upload parse response with callback', function* () {
      // create a file with 1M random data
      var fileName = yield utils.createTempFile('upload-with-callback', 1024 * 1024);

      var name = prefix + 'multipart/upload-with-callback';
      var result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        headers: {
          'x-oss-callback': utils.encodeCallback({
            url: config.callbackServer,
            query: {user: 'js-sdk'},
            body: 'bucket=${bucket}&object=${object}'
          })
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should multipart upload copy with callback', function* () {
      var fileName = yield utils.createTempFile('multipart-upload-file-copy-callback', 2 * 1024 * 1024);
      var name = prefix + 'multipart/upload-file-with-copy-callback';
      yield this.store.multipartUpload(name, fileName);

      var client = this.store;
      var copyName = prefix + 'multipart/upload-file-with-copy-new-callback';
      var result = yield client.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket
      }, {
        partSize: 256 *1024,
        headers: {
          'x-oss-callback': utils.encodeCallback({
            url: config.callbackServer,
            query: {user: 'js-sdk'},
            body: 'bucket=${bucket}&object=${object}'
          })
        },
        copyheaders: {
          'x-oss-copy-source-if-match':''
        }
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should multipart upload with no more 100k file parse response with callback', function* () {
      // create a file with 1M random data
      var fileName = yield utils.createTempFile('upload-with-callback', 50 * 1024);

      var name = prefix + 'multipart/upload-with-callback';
      var result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        headers: {
          'x-oss-callback': utils.encodeCallback({
            url: config.callbackServer,
            query: {user: 'js-sdk'},
            body: 'bucket=${bucket}&object=${object}'
          })
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should putStream parse response with callback', function* () {
      var name = prefix + 'ali-sdk/oss/putstream-callback.js';
      var result = yield this.store.putStream(name, fs.createReadStream(__filename), {
        headers: {
          'x-oss-callback': utils.encodeCallback({
            url: config.callbackServer,
            query: {user: 'js-sdk'},
            body: 'bucket=${bucket}&object=${object}'
          })
        }
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

    it('should put parse response with callback', function* () {
      var name = prefix + 'ali-sdk/oss/put-callback.js';
      var result = yield this.store.put(name, __filename, {
        headers: {
          'x-oss-callback': utils.encodeCallback({
            url: config.callbackServer,
            query: {user: 'js-sdk'},
            body: 'bucket=${bucket}&object=${object}'
          })
        }
      });

      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'OK');
    });

  });

});
