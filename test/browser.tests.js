'use strict';

var assert = require('assert');
var oss = require('../');
// var sts = oss.STS;
var urllib = require('urllib');
var stsConfig = require('./config').sts;
var pkg = require('../package.json');
var platform = require('platform');
var utisl = require('./utils');
var prefix = utisl.prefix;
var sinon = require('sinon');
var md5 = require('crypto-js/md5')
var ossConfig;

// TODO 从配置读取
stsConfig.region = 'oss-cn-beijing';
stsConfig.bucket = 'rpz-test';

describe('browser', function () {
  before(function* () {
    // var url = '/sts';
    var url = 'http://localhost:19876/sts';
    var result = yield urllib.request(url);
    var creds = JSON.parse(result.data);
    ossConfig = {
        region: stsConfig.region,
        accessKeyId: creds.AccessKeyId,
        accessKeySecret: creds.AccessKeySecret,
        stsToken: creds.SecurityToken,
        bucket: stsConfig.bucket
    };
    // this.store = oss({
    //   region: stsConfig.region,
    //   accessKeyId: creds.AccessKeyId,
    //   accessKeySecret: creds.AccessKeySecret,
    //   stsToken: creds.SecurityToken,
    //   bucket: stsConfig.bucket
    // });
  });
  after(function* () {

  });
  describe('endpoint', function () {
    it('should init with region', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou-internal.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://oss-cn-hangzhou-internal.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-beijing',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-beijing.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-shenzhen',
        internal: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-shenzhen.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://vpc100-oss-cn-hangzhou.aliyuncs.com/');
    });

    it('should init with cname: foo.bar.com', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://foo.bar.com',
        cname: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/');
    });

    it('should init with endpoint: http://test.oss.com', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'https://test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://test.oss.com/');
    });

    it('should init with ip address: http://127.0.0.1', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: '127.0.0.1'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://127.0.0.1/');
    });

    it('should create request url with bucket', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      var params = {
        bucket: 'gems'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      var params = {
        bucket: 'gems'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      var params = {
        bucket: 'gems'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:6000'
      });

      var params = {
        bucket: 'gems'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:6000/gems/');
    });

    it('should create request url with bucket/object/subres', function () {
      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      var params = {
        bucket: 'gems',
        object: 'hello'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello');

      var params = {
        bucket: 'gems',
        object: 'hello',
        subres: {acl: '', mime: ''}
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello?acl=&mime=');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      var params = {
        bucket: 'gems',
        object: 'hello'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/hello');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      var params = {
        bucket: 'gems',
        object: 'hello'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/hello');

      var store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:3000'
      });

      var params = {
        bucket: 'gems',
        object: 'hello'
      };

      var url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:3000/gems/hello');
    });

    it('should set User-Agent', function () {

      var store = oss(ossConfig);
      var userAgent = store.userAgent;

      assert(userAgent.startsWith(
        'aliyun-sdk-js/' + pkg.version + ' ' + platform.description));
    });


    it('should trim access id/key', function () {
      var store = oss({
        accessKeyId: '  \tfoo\t\n  ',
        accessKeySecret: '  \tbar\n\r   ',
        region: 'oss-cn-hangzhou',
      });

      assert.equal(store.options.accessKeyId, 'foo');
      assert.equal(store.options.accessKeySecret, 'bar');
    });
  });

  // describe('bucket', function() {
  //   before(function* () {
  //     this.store = oss(Object.assign({}, ossConfig, { region: 'oss-cn-hangzhou'}));
  //   });
  //   it('listBuckets', function* () {
  //     var bucketResult = yield this.store.listBuckets({
  //       // prefix: '',
  //       "max-keys": 20
  //     });
  //     console.log(bucketResult.buckets);
  //   });
  // });

  describe('list()', function () {
    // oss.jpg
    // fun/test.jpg
    // fun/movie/001.avi
    // fun/movie/007.avi
    before(function* () {
      this.store = oss(ossConfig);
      var listPrefix = prefix + 'ali-sdk/list/';
      yield this.store.put(listPrefix + 'oss.jpg', new Buffer('oss.jpg'));
      yield this.store.put(listPrefix + 'fun/test.jpg', new Buffer('fun/test.jpg'));
      yield this.store.put(listPrefix + 'fun/movie/001.avi', new Buffer('fun/movie/001.avi'));
      yield this.store.put(listPrefix + 'fun/movie/007.avi', new Buffer('fun/movie/007.avi'));
      yield this.store.put(listPrefix + 'other/movie/007.avi', new Buffer('other/movie/007.avi'));
      yield this.store.put(listPrefix + 'other/movie/008.avi', new Buffer('other/movie/008.avi'));
      this.listPrefix = listPrefix;
    });

    function checkObjectProperties(obj) {
      assert.equal(typeof obj.name, 'string');
      assert.equal(typeof obj.lastModified, 'string');
      assert.equal(typeof obj.etag, 'string');
      assert(obj.type === 'Normal' || obj.type === 'Multipart');
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
      assert.deepEqual(result.prefixes, [ this.listPrefix + 'fun/', this.listPrefix + 'other/' ]);

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

  describe('put', function() {
    before(function* () {
      this.store = oss(ossConfig);
    });
    it('GETs and PUTs objects to a bucket', function* () {
      var name = prefix + 'put/test';
      var body = new Buffer('body');
      var resultPut = yield this.store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      var resultGet = yield this.store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), body.toString());

      var resultDel = yield this.store.delete(name);
      assert.equal(resultDel.res.status, 204);
    });
  });

  describe('signatureUrl()', function () {
    before(function* () {
      this.store = oss(ossConfig);
      this.name = prefix + 'ali-sdk/oss/signatureUrl.js';
      var object = yield this.store.put(this.name, new Buffer('signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(object.res.status, 200);
      // TODO: 不允许跨域获取 x-oss-request-id
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      // this.headers = object.res.headers;

      this.needEscapeName = prefix + 'ali-sdk/oss/%3get+meta-signatureUrl.js';
      object = yield this.store.put(this.needEscapeName, new Buffer('%3get+meta-signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(object.res.status, 200);
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should signature url get object ok', function* () {
      var result = yield this.store.get(this.name);
      var url = this.store.signatureUrl(this.name);
      var urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    // it('should signature url with image processed and get object ok', function* () {
    //   var name = prefix + 'ali-sdk/oss/nodejs-test-signature-1024x768.png';
    //   var originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
    //   var processedImagePath = path.join(__dirname, 'nodejs-processed-w200.png');
    //   var object = yield this.store.put(name, originImagePath, {
    //     mime: 'image/png'
    //   });
    //
    //   var signUrl = this.store.signatureUrl(name, {expires: 3600, process: 'image/resize,w_200'});
    //   var processedKeyword = "x-oss-process=image%2Fresize%2Cw_200";
    //   assert.equal(signUrl.match(processedKeyword), processedKeyword);
    //   var urlRes = yield urllib.request(signUrl);
    //   assert.equal(urlRes.status, 200);
    //   // assert(urlRes.data.toString() == fs.readFileSync(processedImagePath, 'utf8'),
    //   //   'response content should be same as test/nodejs-processed-w200.png');
    // });
    //
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
      var store = oss(Object.assign({}, ossConfig, {
        endpoint: 'www.aliyun.com',
        cname: true
      }));

      var url = store.signatureUrl(this.name);
      // http://www.aliyun.com/darwin-v4.4.2/ali-sdk/oss/get-meta.js?OSSAccessKeyId=
      assert.equal(url.indexOf('http://www.aliyun.com/'), 0);
    });
  });

  describe('multipart', function() {
    before(function* () {
      this.store = oss(ossConfig);
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
        // var name = '/'
        var ids = [];
        for (var i = 0; i < 5; i++) {
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
        //
        // // after 5
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
        for (var i = 0; i < 5; i++) {
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
      //
      it('should list by id & key marker', function* () {
        var foo_name = prefix + 'multipart/list-foo';
        var foo_ids = [];
        for (var i = 0; i < 5; i++) {
          var result = yield this.store._initMultipartUpload(foo_name);
          foo_ids.push(result.uploadId);
        }
        foo_ids.sort();

        var bar_name = prefix + 'multipart/list-bar';
        var bar_ids = [];
        for (var i = 0; i < 5; i++) {
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
      it('should fallback to putStream when file size is smaller than 100KB', function* () {
        var file = new File(['multipart-fallback-test'], 'multipart-fallback');
        var name = prefix + 'multipart/fallback';
        var progress = 0;
        var putStreamSpy = sinon.spy(this.store, 'putStream');
        var uploadPartSpy = sinon.spy(this.store, '_uploadPart');
        yield this.store.multipartUpload(name, file, {
            progress: function () {
              return function (done) {
                progress++;
                done();
              };
            }
          }
        );
        assert.equal(putStreamSpy.callCount, 1);
        assert.equal(uploadPartSpy.callCount, 0);
        assert.equal(progress, 1);
        this.store.putStream.restore();
        this.store._uploadPart.restore();
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
        // var fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);
        var fileContent = Array(1024*1024).fill('a').join('')
        var file = new File([fileContent], 'multipart-fallback');

        var name = prefix + 'multipart/upload-file.js';
        var progress = 0;
        var result = yield this.store.multipartUpload(name, file, {
          partSize: 100 * 1024,
          progress: function () {
            return function (done) {
              progress++;
              done();
            };
          }
        });
        sinon.restore();
        assert.equal(result.res.status, 200);
        assert.equal(progress, 11);

        var object = yield this.store.get(name);
        assert.equal(object.res.status, 200);

        var fileBuf=new Uint8Array(fileContent.length);
        for(var i=0,j=fileContent.length;i<j;++i){
          fileBuf[i]=fileContent.charCodeAt(i);
        }

        assert.equal(object.content.length, fileBuf.length);
        // avoid comparing buffers directly for it may hang when generating diffs
        assert.deepEqual(md5(object.content), md5(fileBuf));
      });

      // it('should upload file using multipart upload with exception', function* () {
      //   // create a file with 1M random data
      //   var fileContent = Array(1024*1024).fill('a').join('')
      //   var file = new File([fileContent], 'multipart-upload-file');
      //
      //   var name = prefix + 'multipart/upload-file-exception';
      //
      //   var stubUploadPart = sinon.stub(this.store, '_uploadPart');
      //   stubUploadPart.throws("TestUploadPartException");
      //
      //
      //   var error_msg = "";
      //   try {
      //     yield this.store.multipartUpload(name, file, {
      //       progress: function () {
      //         return function (done) {
      //           done();
      //         };
      //       }
      //     });
      //   } catch (err) {
      //     error_msg = err.toString();
      //   }
      //   assert.equal(error_msg,
      //     "Error: Failed to upload some parts with error: TestUploadPartException");
      //   this.store._uploadPart().restore();
      // });
    });
  });
});
