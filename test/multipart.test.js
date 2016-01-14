/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var cfs = require('co-fs');
var utils = require('./utils');
var oss = require('../');
var config = require('./config');
var urllib = require('urllib');
var copy = require('copy-to');
var md5 = require('md5');
var mm = require('mm');

describe('test/multipart.test.js', function () {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);
    this.bucket = 'ali-oss-test-multipart-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = 'oss-cn-hangzhou';

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
    beforeEach(mm.restore);

    var createFile = function* (name, size) {
      var tmpdir = '/tmp/.oss/';
      if (!fs.existsSync(tmpdir)) {
	fs.mkdirSync(tmpdir);
      }

      yield new Promise(function (resolve, reject) {
	var rs = fs.createReadStream('/dev/random', {
	  start: 0,
	  end: size - 1
	});
	var ws = fs.createWriteStream(tmpdir + name);
	rs.pipe(ws);
	ws.on('finish', function (err, res) {
	  if (err) {
	    reject(err);
	  } else {
	    resolve(res);
	  }
	});
      });

      return tmpdir + name;
    };

    it('should fallback to putData when file size is smaller than 100KB', function* () {
      var fileName = yield* createFile('multipart-fallback', 100 * 1024 - 1);

      mm(this.store, '_putData', function* () {
	assert.ok(true);
      });
      mm(this.store, '_uploadPart', function* () {
	assert.ok(false);
      });

      var name = prefix + 'multipart/fallback';
      yield this.store.multipartUpload(name, fileName);
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
      var fileName = yield* createFile('multipart-upload', 1024 * 1024);

      var name = prefix + 'multipart/upload';
      var result = yield this.store.multipartUpload(name, fileName, {
	partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);

      var object = yield this.store.get(name);
      assert.equal(object.res.status, 200);
      var fileBuf = fs.readFileSync(fileName);
      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));
    });
  });
});
