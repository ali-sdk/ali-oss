/**!
 * ali-oss - test/object.test.js
 *
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

var tmpdir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpdir)) {
  fs.mkdirSync(tmpdir);
}

describe('object.test.js', function () {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);
    this.bucket = 'ali-oss-test-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = 'oss-cn-hangzhou';

    console.log('current buckets: %j',
      (yield this.store.listBuckets()).buckets.map(function (item) {
        return item.name + ':' + item.region;
      })
    );

    yield this.store.putBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('put()', function () {
    it('should add object with local file path', function* () {
      var name = prefix + 'ali-sdk/oss/put-localfile.js';
      var object = yield this.store.put(name, __filename);
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);
    });

    it('should add object with content buffer', function* () {
      var name = prefix + 'ali-sdk/oss/put-buffer';
      var object = yield this.store.put('/' + name, new Buffer('foo content'));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert(object.name, name);
    });

    it('should add object with readstream', function* () {
      var name = prefix + 'ali-sdk/oss/put-readstream';
      var object = yield this.store.put(name, fs.createReadStream(__filename), {
        headers: {
          'Content-Length': (yield cfs.stat(__filename)).size
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(typeof object.res.headers.etag, 'string');
      assert(object.name, name);
    });

    it('should throw TypeError when upload stream without Content-Length', function* () {
      yield utils.throws(function* () {
        var name = prefix + 'ali-sdk/oss/put-readstream';
        yield this.store.put(name, fs.createReadStream(__filename));
      }.bind(this), function (err) {
        assert.equal(err.name, 'TypeError');
        assert.equal(err.message, 'streaming upload must given the `Content-Length` header');
      });
    });

    it('should add object with meta', function* () {
      var name = prefix + 'ali-sdk/oss/put-meta.js';
      var object = yield this.store.put(name, __filename, {
        meta: {
          uid: 1,
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      var info = yield this.store.head(name);
      assert.deepEqual(info.meta, {
        uid: '1',
        slus: 'test.html'
      });
      assert.equal(info.status, 200);
    });

    it('should set Content-Disposition with ascii name', function* () {
      var name = prefix + 'ali-sdk/oss/put-Content-Disposition.js';
      var object = yield this.store.put(name, __filename, {
        headers: {
          'Content-Disposition': 'ascii-name.js'
        }
      });
      assert(object.name, name);
      var info = yield this.store.head(name);
      assert.equal(info.res.headers['content-disposition'], 'ascii-name.js');
    });

    it('should set Content-Disposition with no-ascii name', function* () {
      var name = prefix + 'ali-sdk/oss/put-Content-Disposition.js';
      var object = yield this.store.put(name, __filename, {
        headers: {
          'Content-Disposition': encodeURIComponent('non-ascii-名字.js')
        }
      });
      assert(object.name, name);
      var info = yield this.store.head(name);
      assert.equal(info.res.headers['content-disposition'], 'non-ascii-%E5%90%8D%E5%AD%97.js');
    });

    it('should set Expires', function* () {
      var name = prefix + 'ali-sdk/oss/put-Expires.js';
      var object = yield this.store.put(name, __filename, {
        headers: {
          'Expires': 1000000
        }
      });
      assert(object.name, name);
      var info = yield this.store.head(name);
      assert.equal(info.res.headers.expires, '1000000');
    });
  });

  describe('head()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/head-meta.js';
      var object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should head not exists object throw NoSuchKeyError', function* () {
      yield utils.throws(function* () {
        yield this.store.head(this.name + 'not-exists');
      }.bind(this), function (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
      });
    });

    it('should head exists object with If-Modified-Since < object modified time', function* () {
      var lastYear = new Date(this.headers.date);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear = lastYear.toGMTString();
      var info = yield this.store.head(this.name, {
        headers: {
          'If-Modified-Since': lastYear
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Modified-Since = object modified time', function* () {
      var info = yield this.store.head(this.name, {
        headers: {
          'If-Modified-Since': this.headers.date
        }
      });
      assert.equal(info.status, 304);
      assert.equal(info.meta, null);
    });

    it('should head exists object with If-Modified-Since > object modified time', function* () {
      var nextYear = new Date(this.headers.date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear = nextYear.toGMTString();

      var info = yield this.store.head(this.name, {
        headers: {
          'If-Modified-Since': nextYear
        }
      });
      assert.equal(info.status, 304);
      assert.equal(info.meta, null);
    });

    it('should head exists object with If-Unmodified-Since < object modified time', function* () {
      var lastYear = new Date(this.headers.date);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear = lastYear.toGMTString();
      yield utils.throws(function* () {
        yield this.store.head(this.name, {
          headers: {
            'If-Unmodified-Since': lastYear
          }
        });
      }.bind(this), function (err) {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      });
    });

    it('should head exists object with If-Unmodified-Since = object modified time', function* () {
      var info = yield this.store.head(this.name, {
        headers: {
          'If-Unmodified-Since': this.headers.date
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Unmodified-Since > object modified time', function* () {
      var nextYear = new Date(this.headers.date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear = nextYear.toGMTString();

      var info = yield this.store.head(this.name, {
        headers: {
          'If-Unmodified-Since': nextYear
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Match equal etag', function* () {
      var info = yield this.store.head(this.name, {
        headers: {
          'If-Match': this.headers.etag
        }
      });
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });

    it('should head exists object with If-Match not equal etag', function* () {
      yield utils.throws(function* () {
        yield this.store.head(this.name, {
          headers: {
            'If-Match': '"foo-etag"'
          }
        });
      }.bind(this), function (err) {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      });
    });

    it('should head exists object with If-None-Match equal etag', function* () {
      var info = yield this.store.head(this.name, {
        headers: {
          'If-None-Match': this.headers.etag
        }
      });
      assert.equal(info.meta, null);
      assert.equal(info.status, 304);
    });

    it('should head exists object with If-None-Match not equal etag', function* () {
      var info = yield this.store.head(this.name, {
        headers: {
          'If-None-Match': '"foo-etag"'
        }
      });
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });
  });

  describe('get()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/get-meta.js';
      var object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should store object to local file', function* () {
      var savepath = path.join(tmpdir, this.name.replace(/\//g, '-'));
      var result = yield this.store.get(this.name, savepath);
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should throw error when save path parent dir not exists', function* () {
      var savepath = path.join(tmpdir, 'not-exists', this.name.replace(/\//g, '-'));
      yield utils.throws(function* () {
        yield this.store.get(this.name, savepath);
      }.bind(this), /ENOENT/);
    });

    it('should store object to writeStream', function* () {
      var savepath = path.join(tmpdir, this.name.replace(/\//g, '-'));
      var result = yield this.store.get(this.name, fs.createWriteStream(savepath));
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should throw error when writeStream emit error', function* () {
      var savepath = path.join(tmpdir, 'not-exists-dir', this.name.replace(/\//g, '-'));
      yield utils.throws(function* () {
        yield this.store.get(this.name, fs.createWriteStream(savepath));
      }.bind(this), /ENOENT/);
    });

    it('should get object content buffer', function* () {
      var result = yield this.store.get(this.name);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);

      result = yield this.store.get(this.name, null);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
    });

    it('should throw NoSuchKeyError when object not exists', function* () {
      var store = this.store;
      yield utils.throws(function* () {
        yield store.get('not-exists-key');
      }.bind(this), function (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
        assert.equal(err.message, 'The specified key does not exist.');
      });
    });

    describe('If-Modified-Since header', function () {
      it('should 200 when If-Modified-Since < object modified time', function* () {
        var lastYear = new Date(this.headers.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Modified-Since': lastYear
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
        assert.equal(result.res.status, 200);
      });

      it('should 304 when If-Modified-Since = object modified time', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Modified-Since': this.headers.date
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.length, 0);
        assert.equal(result.res.status, 304);
      });

      it('should 304 when If-Modified-Since > object modified time', function* () {
        var nextYear = new Date(this.headers.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Modified-Since': nextYear
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.length, 0);
        assert.equal(result.res.status, 304);
      });
    });

    describe('If-Unmodified-Since header', function () {
      it('should throw PreconditionFailedError when If-Unmodified-Since < object modified time', function* () {
        var lastYear = new Date(this.headers.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        yield utils.throws(function* () {
          yield this.store.get(this.name, {
            headers: {
              'If-Unmodified-Since': lastYear
            }
          });
        }.bind(this), function (err) {
          assert.equal(err.status, 412);
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Unmodified-Since)');
          assert.equal(typeof err.requestId, 'string');
          assert.equal(typeof err.hostId, 'string');
        });
      });

      it('should 200 when If-Unmodified-Since = object modified time', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Unmodified-Since': this.headers.date
          }
        });
        assert.equal(result.res.status, 200);
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
      });

      it('should 200 when If-Unmodified-Since > object modified time', function* () {
        var nextYear = new Date(this.headers.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Unmodified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 200);
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
      });
    });

    describe('If-Match header', function () {
      it('should 200 when If-Match equal object etag', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            'If-Match': this.headers.etag
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should throw PreconditionFailedError when If-Match not equal object etag', function* () {
        yield utils.throws(function* () {
          yield this.store.get(this.name, {
            headers: {
              'If-Match': 'foo'
            }
          });
        }.bind(this), function (err) {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.status, 412);
        });
      });
    });

    describe('If-None-Match header', function () {
      it('should 200 when If-None-Match not equal object etag', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            'If-None-Match': 'foo'
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should 304 when If-None-Match equal object etag', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            'If-None-Match': this.headers.etag
          }
        });
        assert.equal(result.res.status, 304);
        assert.equal(result.content.length, 0);
      });
    });

    describe('Range header', function () {
      it('should work with Range header and get top 10 bytes content', function* () {
        var result = yield this.store.get(this.name, {
          headers: {
            Range: 'bytes=0-9'
          }
        });
        assert.equal(result.res.headers['content-length'], '10');
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.toString(), '/**!\n * al');
      });
    });
  });

  describe('delete()', function () {
    it('should delete exsits object', function* () {
      var name = prefix + 'ali-sdk/oss/delete.js';
      yield this.store.put(name, __filename);

      var info = yield this.store.delete(name);
      assert.equal(info.res.status, 204);

      yield utils.throws(function* () {
        yield this.store.head(name);
      }.bind(this), 'NoSuchKeyError');
    });

    it('should delete not exists object', function* () {
      var info = yield this.store.delete('not-exists-name');
      assert.equal(info.res.status, 204);
    });
  });

  describe('deleteMulti()', function () {
    beforeEach(function* () {
      this.names = [];
      var name = prefix + 'ali-sdk/oss/deleteMulti0.js';
      this.names.push(name);
      yield this.store.put(name, __filename);

      var name = prefix + 'ali-sdk/oss/deleteMulti1.js';
      this.names.push(name);
      yield this.store.put(name, __filename);

      var name = prefix + 'ali-sdk/oss/deleteMulti2.js';
      this.names.push(name);
      yield this.store.put(name, __filename);
    });

    it('should delete 3 exists objs', function* () {
      var result = yield this.store.deleteMulti(this.names);
      assert.deepEqual(result.deleted, this.names);
      assert.equal(result.res.status, 200);
    });

    it('should delete 2 exists and 2 not exists objs', function* () {
      var result = yield this.store.deleteMulti(this.names.slice(0, 2).concat(['not-exist1', 'not-exist2']));
      assert.deepEqual(result.deleted, this.names.slice(0, 2).concat(['not-exist1', 'not-exist2']));
      assert.equal(result.res.status, 200);
    });

    it('should delete 1 exists objs', function* () {
      var result = yield this.store.deleteMulti(this.names.slice(0, 1));
      assert.deepEqual(result.deleted, this.names.slice(0, 1));
      assert.equal(result.res.status, 200);
    });

    it('should delete in quiet mode', function* () {
      var result = yield this.store.deleteMulti(this.names, {
        quiet: true
      });
      assert.equal(result.deleted, null);
      assert.equal(result.res.status, 200);
    });
  });

  describe('copy()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/copy-meta.js';
      var object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should copy object from same bucket', function* () {
      var name = prefix + 'ali-sdk/oss/copy-new.js';
      var result = yield this.store.copy(name, this.name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      var info = yield this.store.head(name);
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });

    it('should copy object and set other meta', function* () {
      var name = prefix + 'ali-sdk/oss/copy-new-2.js';
      var result = yield this.store.copy(name, this.name, {
        meta: {
          uid: '2'
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      var info = yield this.store.head(name);
      assert.equal(info.meta.uid, '2');
      assert(!info.meta.pid);
      assert(!info.meta.slus);
      assert.equal(info.status, 200);
    });

    it('should throw NoSuchKeyError when source object not exists', function* () {
      yield utils.throws(function* () {
        yield this.store.copy('new-object', 'not-exists-object');
      }.bind(this), function (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.message, 'The specified key does not exist.');
        assert.equal(err.status, 404);
      });
    });

    describe('If-Match header', function () {
      it('should throw PreconditionFailedError when If-Match not equal source object etag', function* () {
        yield utils.throws(function* () {
          yield this.store.copy('new-name', this.name, {
            headers: {
              'If-Match': 'foo-bar'
            }
          });
        }.bind(this), function (err) {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Match)');
          assert.equal(err.status, 412);
        });
      });

      it('should copy object when If-Match equal source object etag', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Match.js';
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Match': this.headers.etag
          }
        });
        assert.equal(result.res.status, 200);
        assert.equal(typeof result.data.etag, 'string');
        assert.equal(typeof result.data.lastModified, 'string');
      });
    });

    describe('If-None-Match header', function () {
      it('should return 304 when If-None-Match equal source object etag', function* () {
        var result = yield this.store.copy('new-name', this.name, {
          headers: {
            'If-None-Match': this.headers.etag
          }
        });
        assert.equal(result.res.status, 304);
        assert.equal(result.data, null);
      });

      it('should copy object when If-None-Match not equal source object etag', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-None-Match.js';
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-None-Match': 'foo-bar'
          }
        });
        assert.equal(result.res.status, 200);
        assert.equal(typeof result.data.etag, 'string');
        assert.equal(typeof result.data.lastModified, 'string');
      });
    });

    describe('If-Modified-Since header', function () {
      it('should 304 when If-Modified-Since > source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Modified-Since.js';
        var nextYear = new Date(this.headers.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Modified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 304);
      });

      it('should 304 when If-Modified-Since >= source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Modified-Since.js';
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Modified-Since': this.headers.date
          }
        });
        assert.equal(result.res.status, 304);
      });

      it('should 200 when If-Modified-Since < source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Modified-Since.js';
        var lastYear = new Date(this.headers.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Modified-Since': lastYear
          }
        });
        assert.equal(result.res.status, 200);
      });
    });

    describe('If-Unmodified-Since header', function () {
      it('should 200 when If-Unmodified-Since > source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Unmodified-Since.js';
        var nextYear = new Date(this.headers.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Unmodified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should 200 when If-Unmodified-Since >= source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Unmodified-Since.js';
        var result = yield this.store.copy(name, this.name, {
          headers: {
            'If-Unmodified-Since': this.headers.date
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should throw PreconditionFailedError when If-Unmodified-Since < source object modified time', function* () {
        var name = prefix + 'ali-sdk/oss/copy-new-If-Unmodified-Since.js';
        var lastYear = new Date(this.headers.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        yield utils.throws(function* () {
          yield this.store.copy(name, this.name, {
            headers: {
              'If-Unmodified-Since': lastYear
            }
          });
        }.bind(this), function (err) {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Unmodified-Since)');
          assert.equal(err.status, 412);
        });
      });
    });
  });

  describe('putMeta()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/putMeta.js';
      var object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should update exists object meta', function* () {
      yield this.store.putMeta(this.name, {
        uid: '2'
      });
      var info = yield this.store.head(this.name);
      assert.equal(info.meta.uid, '2');
      assert(!info.meta.pid);
      assert(!info.meta.slus);
    });

    it('should throw NoSuchKeyError when update not exists object meta', function* () {
      yield utils.throws(function* () {
        yield this.store.putMeta(this.name + 'not-exists', {
          uid: '2'
        });
      }.bind(this), function (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
      });
    });
  });

  describe('list()', function () {
    // oss.jpg
    // fun/test.jpg
    // fun/movie/001.avi
    // fun/movie/007.avi
    before(function* () {
      var listPrefix =  prefix + 'ali-sdk/list/';
      yield this.store.put(listPrefix + 'oss.jpg', new Buffer('oss.jpg'));
      yield this.store.put(listPrefix + 'fun/test.jpg', new Buffer('fun/test.jpg'));
      yield this.store.put(listPrefix + 'fun/movie/001.avi', new Buffer('fun/movie/001.avi'));
      yield this.store.put(listPrefix + 'fun/movie/007.avi', new Buffer('fun/movie/007.avi'));
      this.listPrefix = listPrefix;
    });

    function checkObjectProperties(obj) {
      assert.equal(typeof obj.name, 'string');
      assert.equal(typeof obj.lastModified, 'string');
      assert.equal(typeof obj.etag, 'string');
      assert.equal(obj.type, 'Normal');
      assert.equal(typeof obj.size, 'number');
      assert.equal(obj.storageClass, 'Standard');
      assert.equal(typeof obj.owner, 'object');
      assert.equal(typeof obj.owner.id, 'string');
      assert.equal(typeof obj.owner.displayName, 'string');
    }

    it('should list only 1 object', function* () {
      var result = yield this.store.list({
        'max-keys': 1
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list top 3 objects', function* () {
      var result = yield this.store.list({
        'max-keys': 3
      });
      assert.equal(result.objects.length, 3);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);

      // next 2
      var result2 = yield this.store.list({
        'max-keys': 2,
        marker: result.nextMarker
      });
      assert.equal(result2.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result2.nextMarker, 'string');
      assert(result2.isTruncated);
      assert.equal(result2.prefixes, null);
    });

    it('should list with prefix', function* () {
      var result = yield this.store.list({
        prefix: this.listPrefix + 'fun/movie/',
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);

      var result = yield this.store.list({
        prefix: this.listPrefix + 'fun/movie',
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list current dir files only', function* () {
      var result = yield this.store.list({
        prefix: this.listPrefix,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [this.listPrefix + 'fun/']);

      var result = yield this.store.list({
        prefix: this.listPrefix + 'fun/',
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [this.listPrefix + 'fun/movie/']);

      var result = yield this.store.list({
        prefix: this.listPrefix + 'fun/movie/',
        delimiter: '/'
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });
  });
});
