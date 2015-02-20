/**!
 * ali-oss - test/bucket.test.js
 *
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');
var utils = require('./utils');
var oss = require('../');
var config = require('./config');

describe('bucket.test.js', function () {
  var prefix = process.platform + '-' + process.version + '/';
  if (process.execPath.indexOf('iojs') >= 0) {
    prefix = 'iojs-' + prefix;
  }
  before(function () {
    this.store = oss(config);
  });

  describe('putBucket()', function () {
    before(function () {
      this.buckets = [];
      var name = 'ali-oss-test-bucket-' + prefix.replace(/[\/\.]/g, '-');
      this.name = name.substring(0, name.length - 1);
    });

    it('should create a new bucket on HongKong region', function* () {
      var result = yield this.store.putBucket(this.name, {
        region: 'oss-cn-hongkong'
      });
      assert.equal(result.bucket, this.name);
      assert.equal(result.res.status, 200);
      this.buckets.push({
        name: this.name,
        region: 'oss-cn-hongkong'
      });

      // create a exists should work
      var result = yield this.store.putBucket(this.name, {
        region: 'oss-cn-hongkong'
      });
      assert.equal(result.res.status, 200);
      assert.equal(result.bucket, this.name);
    });

    it('should throw BucketAlreadyExistsError when change exists bucket region', function* () {
      yield utils.throws(function* () {
        yield this.store.putBucket(this.name, {
          region: 'oss-cn-hangzhou'
        });
      }.bind(this), function (err) {
        assert.equal(err.name, 'BucketAlreadyExistsError');
        assert.equal(err.message, 'Bucket already exists can\'t modify location.');
        assert.equal(err.status, 409);
      });
    });

    after(function* () {
      // clean up
      for (var i = 0; i < this.buckets.length; i++) {
        var info = this.buckets[i];
        var result = yield this.store.deleteBucket(info.name, {
          region: info.region
        });
        assert(result.res.status === 200 || result.res.status === 204);
      }
    });
  });

  describe('listBuckets()', function () {
    it('should list top 3 buckets', function* () {
      var result = yield this.store.listBuckets({
        "max-keys": 3
      });
      assert(Array.isArray(result.buckets));
      assert(result.buckets.length > 0);
      assert.equal(typeof result.buckets[0].Location, 'string');
      assert.equal(typeof result.buckets[0].Name, 'string');
      assert.equal(typeof result.buckets[0].CreationDate, 'string');

      assert(!result.isTruncated);
      assert.equal(result.nextMarker, null);
      assert(result.owner);
      assert.equal(typeof result.owner.ID, 'string');
      assert.equal(typeof result.owner.DisplayName, 'string');
    });
  });

  describe('deleteBucket()', function () {
    it('should delete not exists bucket throw NoSuchBucketError', function* () {
      yield utils.throws(function* () {
        yield this.store.deleteBucket('not-exists-bucket');
      }.bind(this), 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', function* () {
      yield utils.throws(function* () {
        yield this.store.deleteBucket(this.store.options.bucket);
      }.bind(this), 'BucketNotEmptyError');
    });
  });
});
