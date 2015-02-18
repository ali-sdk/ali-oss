/**!
 * ali-oss - test/oss.test.js
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

var fs = require('fs');
var assert = require('assert');
var oss = require('../');
var config = require('./config');

describe('oss.test.js', function () {
  var prefix = process.version + '/';
  if (process.execPath.indexOf('iojs') >= 0) {
    prefix = 'iojs-' + prefix;
  }
  before(function () {
    this.store = oss(config);
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
      var object = yield this.store.put(name, fs.createReadStream(__filename));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert(object.name, name);
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
      try {
        yield this.store.head(this.name + 'not-exists');
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
      }
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
      try {
        yield this.store.head(this.name, {
          headers: {
            'If-Unmodified-Since': lastYear
          }
        });
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      }
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
      try {
        yield this.store.head(this.name, {
          headers: {
            'If-Match': '"foo-etag"'
          }
        });
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      }
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

  describe('delete()', function () {
    it('should delete exsits object', function* () {
      var name = prefix + 'ali-sdk/oss/delete.js';
      yield this.store.put(name, __filename);

      var info = yield this.store.delete(name);
      assert.equal(info.res.status, 204);

      try {
        yield this.store.head(name);
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'NoSuchKeyError');
      }
    });

    it('should delete not exists object', function* () {
      var info = yield this.store.delete('not-exists-name');
      assert.equal(info.res.status, 204);
    });
  });
});
