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

  describe('listUploads()', function () {
    beforeEach(function* () {
      var result = yield this.store.listUploads({
        'max-uploads': 1000
      });
      var uploads = result.uploads || [];
      for (var i = 0; i < uploads.length; i++) {
        var up = uploads[i];
        yield this.store.abortMultipartUpload(up.name, up.uploadId);
      }
    });

    it('should list by key marker', function* () {
      var name = prefix + 'multipart/list-key';
      var ids = [];
      for (var i = 0; i < 5; i ++) {
        var result = yield this.store._initMultipartUpload(name + i);
        ids.push(result.uploadId);
      }
      // list all uploads
      var result = yield this.store.listUploads({
        'max-uploads': 10,
      });
      var all = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(all, ids);

      // after 1
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': name + 0
      });
      var after_1 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(after_1, ids.slice(1));

      // after 5
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': name + 4
      });
      var after_5 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(after_5.length, 0);
    });

    it('should list by id marker', function* () {
      var name = prefix + 'multipart/list-id';
      var ids = [];
      for (var i = 0; i < 5; i ++) {
        var result = yield this.store._initMultipartUpload(name);
        ids.push(result.uploadId);
      }
      ids.sort();

      // list all uploads
      var result = yield this.store.listUploads({
        'max-uploads': 10,
      });
      var all = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(all, ids);

      // after 1: upload id marker alone is ignored
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'upload-id-marker': ids[1]
      });
      var after_1 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(after_1, ids);

      // after 5: upload id marker alone is ignored
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'upload-id-marker': ids[4]
      });
      var after_5 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(after_5, ids);
    });

    it('should list by id & key marker', function* () {
      var foo_name = prefix + 'multipart/list-foo';
      var foo_ids = [];
      for (var i = 0; i < 5; i ++) {
        var result = yield this.store._initMultipartUpload(foo_name);
        foo_ids.push(result.uploadId);
      }
      foo_ids.sort();

      var bar_name = prefix + 'multipart/list-bar';
      var bar_ids = [];
      for (var i = 0; i < 5; i ++) {
        var result = yield this.store._initMultipartUpload(bar_name);
        bar_ids.push(result.uploadId);
      }
      bar_ids.sort();

      // after 1
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': bar_name,
        'upload-id-marker': bar_ids[0]
      });
      var after_1 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      after_1.sort();
      var should = bar_ids.slice(1).concat(foo_ids).sort();
      assert.deepEqual(after_1, should);

      // after 5
      var result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': bar_name,
        'upload-id-marker': bar_ids[4]
      });
      var after_5 = result.uploads.map(function (up) {
        return up.uploadId;
      });
      assert.deepEqual(after_5, foo_ids);
    });
  });

  describe('multipartUpload()', function () {
    afterEach(mm.restore);

    it('should fallback to putStream when file size is smaller than 100KB', function* () {
      var fileName = yield utils.createTempFile('multipart-fallback', 100 * 1024 - 1);

      var putStreamCalled = false;
      mm(this.store, 'putStream', function* () {
        putStreamCalled = true;
      });
      var uploadPartCalled = false;
      mm(this.store, '_uploadPart', function* () {
        uploadPartCalled = true;
      });

      var name = prefix + 'multipart/fallback';
      var progress = 0;
      yield this.store.multipartUpload(name, fileName, {
        progress: function () {
          progress++;
        }
      });
      assert(putStreamCalled);
      assert(!uploadPartCalled);
      assert.equal(progress, 1);
    });

    it('should use default partSize when not specified', function* () {
      var partSize = this.store._getPartSize(1024 * 1024, null);
      assert.equal(partSize, 1 * 1024 * 1024);
    });

    it('should use user specified partSize', function* () {
      var partSize = this.store._getPartSize(1024 * 1024, 200 * 1024);
      assert.equal(partSize, 200 * 1024);
    });

    it('should not exceeds max part number', function* () {
      var fileSize = 10 * 1024 * 1024 * 1024;
      var maxNumParts = 10 * 1000;

      var partSize = this.store._getPartSize(fileSize, 100 * 1024);
      assert.equal(partSize, Math.ceil(fileSize / maxNumParts));
    });

    it('should upload file using multipart upload', function* () {
      // create a file with 1M random data
      var fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      var name = prefix + 'multipart/upload-file';
      var progress = 0;
      var result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        progress: function () {
          progress++;
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(progress, 11);

      var object = yield this.store.get(name);
      assert.equal(object.res.status, 200);
      var fileBuf = fs.readFileSync(fileName);
      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));
    });

    it('should upload file using multipart upload with exception', function* () {
      // create a file with 1M random data
      var fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      var name = prefix + 'multipart/upload-file-exception';
      var progress = 0;
      var clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);

      var stubUploadPart = sinon.stub(clientTmp, '_uploadPart');
      stubUploadPart.throws("TestUploadPartException");


      var error_msg = "";
      try {
        yield clientTmp.multipartUpload(name, fileName);
      } catch (err) {
        error_msg = err.toString();
      }
      assert.equal(error_msg,
        "Error: Failed to upload some parts with error: TestUploadPartException");
    });

    it('should upload web file using multipart upload', function* () {
      var File = function (name, content) {
        this.name = name;
        this.buffer = content;
        this.size = this.buffer.length;

        this.slice = function (start, end) {
          return new File(this.name, this.buffer.slice(start, end));
        }
      };
      var FileReader = require('filereader');

      mm(global, 'File', File);
      mm(global, 'FileReader', FileReader);

      // create a file with 1M random data
      var fileName = yield utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
      var fileBuf = fs.readFileSync(fileName);
      var webFile = new File(fileName, fileBuf);

      var name = prefix + 'multipart/upload-webfile';
      var result = yield this.store.multipartUpload(name, webFile, {
        partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);

      var object = yield this.store.get(name);
      assert.equal(object.res.status, 200);

      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));

      mm.restore();
    });

    it('should upload web file using multipart upload in IE10', function* () {
      
      var File = function (name, content) {
        this.name = name;
        this.buffer = content;
        this.size = this.buffer.length;

        this.slice = function (start, end) {
          return new File(this.name, this.buffer.slice(start, end));
        }
      };
      var FileReader = require('filereader');

      mm(global, 'File', File);
      mm(global, 'FileReader', FileReader);

      // create a file with 1M random data
      var fileName = yield utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
      var fileBuf = fs.readFileSync(fileName);
      var webFile = new File(fileName, fileBuf);
      var name = prefix + 'multipart/upload-webfile-ie10';
      var clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);
      sinon.stub(clientTmp, 'checkBrowserAndVersion', function(browser, version) {
        return (browser == "Internet Explorer" && version == "10");
      });
      var result = yield clientTmp.multipartUpload(name, webFile, {
        partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);

      var object = yield clientTmp.get(name);
      assert.equal(object.res.status, 200);

      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));

      mm.restore();
    });

    it('should resume upload using checkpoint', function* () {
      var _uploadPart = this.store._uploadPart;
      mm(this.store, '_uploadPart', function* (name, uploadId, partNo, data) {
        if (partNo == 5) {
          throw new Error('mock upload part fail.');
        } else {
          return _uploadPart.call(this, name, uploadId, partNo, data);
        }
      });

      // create a file with 1M random data
      var fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      var name = prefix + 'multipart/upload-file';
      var cptFile = '/tmp/.oss/cpt.json';
      var progress = 0;
      try {
        var result = yield this.store.multipartUpload(name, fileName, {
          partSize: 100 * 1024,
          progress: function (percent, cpt) {
            progress ++;
            fs.writeFileSync(cptFile, JSON.stringify(cpt));
          }
        });
        // should not succeed
        assert(false);
      } catch (err) {
        // pass
      }

      mm.restore();
      var result = yield this.store.multipartUpload(name, fileName, {
        checkpoint: JSON.parse(fs.readFileSync(cptFile)),
        progress: function () {
          progress ++;
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(progress, 11);

      var object = yield this.store.get(name);
      assert.equal(object.res.status, 200);
      var fileBuf = fs.readFileSync(fileName);
      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));
    });

    // callback server on EC2, maybe fail on China, bug pass on travis ci
    it('should parse response with callback', function* () {
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
  });
});
