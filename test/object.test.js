'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var cfs = require('co-fs');
var Readable = require('stream').Readable;
var utils = require('./utils');
var oss = require('../');
var sts = require('../').STS;
var config = require('./config').oss;
var stsConfig = require('./config').sts;
var urllib = require('urllib');
var copy = require('copy-to');
var mm = require('mm');

var tmpdir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpdir)) {
  fs.mkdirSync(tmpdir);
}

describe('test/object.test.js', function () {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);
    this.bucket = 'ali-oss-test-object-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;
    // console.log('current buckets: %j',
    //   (yield this.store.listBuckets()).buckets.map(function (item) {
    //     return item.name + ':' + item.region;
    //   })
    // );
    yield this.store.putBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('putStream()', function () {
    afterEach(mm.restore);

    it('should add object with streaming way', function* () {
      var name = prefix + 'ali-sdk/oss/putStream-localfile.js';
      var object = yield this.store.putStream(name, fs.createReadStream(__filename));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);
      assert(object.url);

      // check content
      var r = yield this.store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.content.toString(), fs.readFileSync(__filename, 'utf8'));
    });

    it('should use chunked encoding', function* () {
      var name = prefix + 'ali-sdk/oss/chunked-encoding.js';
      var headers;
      var req = this.store.urllib.request;
      mm(this.store.urllib, 'request', function (url, args) {
        headers = args.headers;
        return req(url, args);
      });

      var result = yield this.store.putStream(name, fs.createReadStream(__filename));

      assert.equal(result.res.status, 200);
      assert.equal(headers['Transfer-Encoding'], 'chunked');
    });

    it('should NOT use chunked encoding', function* () {
      var name = prefix + 'ali-sdk/oss/no-chunked-encoding.js';
      var headers;
      var req = this.store.urllib.request;
      mm(this.store.urllib, 'request', function (url, args) {
        headers = args.headers;
        return req(url, args);
      });

      var options = {
        contentLength: fs.statSync(__filename).size
      };
      var result = yield this.store.putStream(
        name, fs.createReadStream(__filename), options);

      assert(!headers['Transfer-Encoding']);
      assert.equal(result.res.status, 200);
    });

    it('should add image with streaming way', function* () {
      var name = prefix + 'ali-sdk/oss/nodejs-1024x768.png';
      var imagepath = path.join(__dirname, 'nodejs-1024x768.png');
      var object = yield this.store.putStream(name, fs.createReadStream(imagepath), {
        mime: 'image/png'
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      // check content
      var r = yield this.store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.res.headers['content-type'], 'image/png');
      var buf = fs.readFileSync(imagepath);
      assert.equal(r.content.length, buf.length);
      assert.deepEqual(r.content, buf);
    });

    it('should add very big file: 10mb with streaming way', function* () {
      var name = prefix + 'ali-sdk/oss/bigfile-10mb.bin';
      var bigfile = path.join(__dirname, '.tmp', 'bigfile-10mb.bin');
      fs.writeFileSync(bigfile, new Buffer(10 * 1024 * 1024).fill('a\n'));
      var object = yield this.store.putStream(name, fs.createReadStream(bigfile));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      // check content
      var r = yield this.store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.res.headers['content-type'], 'application/octet-stream');
      assert.equal(r.res.size, 10 * 1024 * 1024);
      var buf = fs.readFileSync(bigfile);
      assert.equal(r.content.length, buf.length);
      assert.deepEqual(r.content, buf);
    });

    it('should parse response with callback', function* () {
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
  });

  describe('getObjectUrl()', function() {
    it('should return object url', function() {
      var name = 'test.js';
      var url = this.store.getObjectUrl(name);
      assert.equal(url, this.store.options.endpoint.format() + name);

      var name = '/foo/bar/a%2Faa/test&+-123~!.js';
      var url = this.store.getObjectUrl(name, 'https://foo.com');
      assert.equal(url, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
      var url2 = this.store.getObjectUrl(name, 'https://foo.com/');
      assert.equal(url2, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
    });
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

    it('should set custom Content-Type', function* () {
      var name = prefix + 'ali-sdk/oss/put-Content-Type.js';
      var object = yield this.store.put(name, __filename, {
        headers: {
          'Content-Type': 'text/plain; charset=gbk'
        }
      });
      assert(object.name, name);
      var info = yield this.store.head(name);
      assert.equal(info.res.headers['content-type'], 'text/plain; charset=gbk');
    });

    it('should set custom content-type lower case', function* () {
      var name = prefix + 'ali-sdk/oss/put-Content-Type.js';
      var object = yield this.store.put(name, __filename, {
        headers: {
          'content-type': 'application/javascript; charset=utf8'
        }
      });
      assert(object.name, name);
      var info = yield this.store.head(name);
      assert.equal(info.res.headers['content-type'], 'application/javascript; charset=utf8');
    });

    it('should parse response with callback', function* () {
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

  describe('mimetype', function () {
    var createFile = function* (name, size) {
      size = size || 200 * 1024;
      yield new Promise(function (resolve, reject) {
        var rs = fs.createReadStream('/dev/random', {
          start: 0,
          end: size - 1
        });
        var ws = fs.createWriteStream(name);
        rs.pipe(ws);
        ws.on('finish', function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      return name;
    };

    it('should set mimetype by file ext', function* () {
      var filepath = path.join(tmpdir, 'content-type-by-file.jpg');
      yield createFile(filepath);
      var name = prefix + 'ali-sdk/oss/content-type-by-file.png';
      yield this.store.put(name, filepath);

      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/jpeg');

      yield this.store.multipartUpload(name, filepath);
      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/jpeg');
    });

    it('should set mimetype by object key', function* () {
      var filepath = path.join(tmpdir, 'content-type-by-file');
      yield createFile(filepath);
      var name = prefix + 'ali-sdk/oss/content-type-by-file.png';
      yield this.store.put(name, filepath);

      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/png');
      yield this.store.multipartUpload(name, filepath);
      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/png');
    });

    it('should set user-specified mimetype', function* () {
      var filepath = path.join(tmpdir, 'content-type-by-file.jpg');
      yield createFile(filepath);
      var name = prefix + 'ali-sdk/oss/content-type-by-file.png';
      yield this.store.put(name, filepath, {mime: 'text/plain'});

      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'text/plain');
      yield this.store.multipartUpload(name, filepath, {
        mime: 'text/plain'
      });
      var result = yield this.store.head(name);
      assert.equal(result.res.headers['content-type'], 'text/plain');
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

      this.needEscapeName = prefix + 'ali-sdk/oss/%3get+meta.js';
      object = yield this.store.put(this.needEscapeName, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should store object to local file', function* () {
      var savepath = path.join(tmpdir, this.name.replace(/\//g, '-'));
      var result = yield this.store.get(this.name, savepath);
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should escape uri path ok', function* () {
      var savepath = path.join(tmpdir, this.needEscapeName.replace(/\//g, '-'));
      var result = yield this.store.get(this.needEscapeName, savepath);
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

    it('should store not exists object to file', function* () {
      var savepath = path.join(tmpdir, this.name.replace(/\//g, '-'));
      yield utils.throws(function* () {
        yield this.store.get(this.name + 'not-exists', savepath);
      }.bind(this), function (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert(!fs.existsSync(savepath));
      });
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

    it('should get object content buffer with image process', function* () {
      var name = prefix + 'ali-sdk/oss/nodejs-test-get-image-1024x768.png';
      var originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
      var processedImagePath = path.join(__dirname, 'nodejs-processed-w200.png');
      var object = yield this.store.put(name, originImagePath, {
        mime: 'image/png'
      });

      var result = yield this.store.get(name, {process: 'image/resize,w_200'});
      assert.equal(result.res.status, 200);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString() == fs.readFileSync(processedImagePath, 'utf8'),
        'get content should be same as test/nodejs-processed-w200.png');

      // it should use the value of process 
      // when 'subres.x-oss-process' coexists with 'process'.
      result = yield this.store.get(name, 
        {process: 'image/resize,w_200', subres: {'x-oss-process': 'image/resize,w_100'}});
      assert.equal(result.res.status, 200);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString() == fs.readFileSync(processedImagePath, 'utf8'),
        'get content should be same as test/nodejs-processed-w200.png');

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
        assert.equal(result.content.toString(), '\'use stric');
      });
    });
  });

  describe('signatureUrl()', function () {
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

      this.needEscapeName = prefix + 'ali-sdk/oss/%3get+meta.js';
      object = yield this.store.put(this.needEscapeName, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should signature url get object ok', function* () {
      var result = yield this.store.get(this.name);
      var url = this.store.signatureUrl(this.name);
      var urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    it('should signature url with image processed and get object ok', function* () {
      var name = prefix + 'ali-sdk/oss/nodejs-test-signature-1024x768.png';
      var originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
      var processedImagePath = path.join(__dirname, 'nodejs-processed-w200.png');
      var object = yield this.store.put(name, originImagePath, {
        mime: 'image/png'
      });

      var signUrl = this.store.signatureUrl(name, {expires: 3600, process: 'image/resize,w_200'});
      var processedKeyword = "x-oss-process=image%2Fresize%2Cw_200";
      assert.equal(signUrl.match(processedKeyword), processedKeyword);
      var urlRes = yield urllib.request(signUrl);
      assert.equal(urlRes.status, 200);
      assert(urlRes.data.toString() == fs.readFileSync(processedImagePath, 'utf8'),
        'response content should be same as test/nodejs-processed-w200.png');
    });

    it('should signature url for PUT', function* () {
      var url = this.store.signatureUrl(this.name, {method: 'PUT'});
      var res = yield urllib.request(url, {method: 'PUT'});
      assert.equal(res.status, 200);
    });

    it('should signature url get need escape object ok', function* () {
      var result = yield this.store.get(this.needEscapeName);
      var url = this.store.signatureUrl(this.needEscapeName);
      var urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    it('should signature url with custom host ok', function() {
      var conf = {};
      copy(config).to(conf);
      conf.endpoint = 'www.aliyun.com';
      conf.cname = true;
      var store = oss(conf);

      var url = store.signatureUrl(this.name);
      // http://www.aliyun.com/darwin-v4.4.2/ali-sdk/oss/get-meta.js?OSSAccessKeyId=
      assert.equal(url.indexOf('http://www.aliyun.com/'), 0);
    });
  });

  describe('signatureUrl() with sts', function () {
    before(function* () {
      var stsClient = sts(stsConfig);
      var result = yield stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);

      this.ossClient = oss({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket
      });

      this.name = 'sts/signature';
      this.content = 'Get signature url with STS token.';
      var result = yield this.ossClient.put(this.name, new Buffer(this.content));
      assert.equal(result.res.status, 200);
    });

    it('should signature url with sts', function* () {
      var url = this.ossClient.signatureUrl(this.name);
      var urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), this.content);
    });

    it('should overwrite response content-type & content-disposition', function* () {
      var url = this.ossClient.signatureUrl(this.name, {
        expires: 3600,
        response: {
          'content-type': 'text/custom',
          'content-disposition': 'attachment'
        }
      });
      var urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), this.content);
      assert.equal(urlRes.headers['content-type'], 'text/custom');
      assert.equal(urlRes.headers['content-disposition'], 'attachment');
    });
  });

  describe('getStream()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/get-stream.js';
      var object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      this.headers = object.res.headers;
    });

    it('should get exists object stream', function* () {
      var result = yield this.store.getStream(this.name);
      assert.equal(result.res.status, 200);
      assert(result.stream instanceof Readable);
      var tmpfile = path.join(tmpdir, 'get-stream.js');
      var tmpstream = fs.createWriteStream(tmpfile);

      function finish() {
        return function (callback) {
          tmpstream.on('finish', callback);
        };
      }

      result.stream.pipe(tmpstream);
      yield finish();
      assert.equal(fs.readFileSync(tmpfile, 'utf8'), fs.readFileSync(__filename, 'utf8'));
    });

    it('should throw error when object not exists', function* () {
      try {
        yield this.store.getStream(this.name + 'not-exists');
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'NoSuchKeyError');
      }
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

    it('should copy object with non-english name', function* () {
      var source_name = prefix + 'ali-sdk/oss/copy-meta_测试.js';
      var result = yield this.store.put(source_name, __filename, {
        meta: {
          uid: 2,
          pid: '1234',
          slus: 'test1.html'
        }
      });

      var name = prefix + 'ali-sdk/oss/copy-new_测试.js';
      result = yield this.store.copy(name, source_name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      var info = yield this.store.head(name);
      assert.equal(info.meta.uid, '2');
      assert.equal(info.meta.pid, '1234');
      assert.equal(info.meta.slus, 'test1.html');
      assert.equal(info.status, 200);
    });

    it('should copy object with non-english name and bucket', function* () {
      var source_name = prefix + 'ali-sdk/oss/copy-meta_测试2.js';
      var result = yield this.store.put(source_name, __filename, {
        meta: {
          uid: 3,
          pid: '12345',
          slus: 'test2.html'
        }
      });

      var info = yield this.store.head(source_name);
      assert.equal(info.meta.uid, '3');
      assert.equal(info.meta.pid, '12345');
      assert.equal(info.meta.slus, 'test2.html');
      assert.equal(info.status, 200);

      source_name = '/' + this.bucket + '/' + source_name;
      var name = prefix + 'ali-sdk/oss/copy-new_测试2.js';
      result = yield this.store.copy(name, source_name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      info = yield this.store.head(name);
      assert.equal(info.meta.uid, '3');
      assert.equal(info.meta.pid, '12345');
      assert.equal(info.meta.slus, 'test2.html');
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

    it('should use copy to change exists object headers', function* () {
      var name = prefix + 'ali-sdk/oss/copy-new-3.js';
      var result = yield this.store.copy(name, this.name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');
      var info = yield this.store.head(name);
      assert(!info.res.headers['cache-control']);

      // add Cache-Control header to a exists object
      var result = yield this.store.copy(name, name, {
        headers: {
          'Cache-Control': 'max-age=0, s-maxage=86400',
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');
      var info = yield this.store.head(name);
      assert.equal(info.res.headers['cache-control'], 'max-age=0, s-maxage=86400');
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

  describe('object key encoding', function () {
    it('should encode variant object keys', function* () {
      var prefix = 'ali-oss-test-key-';
      var keys = {
        simple: 'simple_key',
        chinese: '杭州・中国',
        space: '是 空格 yeah +-/\\&*#(1) ',
        invisible: '\x01\x0a\x0c\x07\x50\x63',
        xml: 'a<b&c>d +'
      };

      var names = [];
      for (var k in keys) {
        var key = prefix + keys[k];
        var result = yield this.store.put(key, new Buffer(''));
        assert.equal(result.res.status, 200);

        var result = yield this.store.list({
          prefix: prefix
        });
        var objects = result.objects.map(function (obj) {
          return obj.name;
        });
        assert(objects.indexOf(key) >= 0);

        var result = yield this.store.head(key);
        assert.equal(result.res.status, 200);

        names.push(keys[k]);
      }

      var result = yield this.store.deleteMulti(names);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.deleted, names);
    });
  });

  describe('putACL(), getACL()', function () {
    it('should put and get object ACL', function* () {
      var name = prefix + 'object/acl';
      var result = yield this.store.put(name, new Buffer('hello world'));
      assert.equal(result.res.status, 200);

      var result = yield this.store.getACL(name);
      assert.equal(result.res.status, 200);
      assert.equal(result.acl, 'default');

      var result = yield this.store.putACL(name, 'public-read');
      assert.equal(result.res.status, 200);

      var result = yield this.store.getACL(name);
      assert.equal(result.res.status, 200);
      assert.equal(result.acl, 'public-read');

      var result = yield this.store.get(name);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.content, new Buffer('hello world'));
    });
  });
});
