
const assert = require('assert');
// var oss = require('../');
// var oss = OSS.Wrapper;
/* eslint no-undef: [0] */
const oss = OSS;
// var sts = oss.STS;
const urllib = require('urllib');
/* eslint import/no-unresolved: [0] */
const stsConfig = require('./.tmp/stsConfig.json');
const pkg = require('../../package.json');
const platform = require('platform');
const utisl = require('../../test/node/utils');
const { callbackServer } = require('../../test/const');

const { prefix } = utisl;
const sinon = require('sinon');
const md5 = require('crypto-js/md5');
const crypto1 = require('crypto');

let ossConfig;
const timemachine = require('timemachine');
const co = require('co');

timemachine.reset();

let cleanBucket = function* (store) {
  let result = yield store.list({
    'max-keys': 1000,
  });
  result.objects = result.objects || [];
  for (let i = 0; i < result.objects.length; i++) {
    const obj = result.objects[i];
    yield store.delete(obj.name);
  }

  result = yield store.listUploads({
    'max-uploads': 1000,
  });
  const uploads = result.uploads || [];
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    yield store.abortMultipartUpload(up.name, up.uploadId);
  }
}

describe('browser', () => {
  /* eslint require-yield: [0] */
  before(function* () {
    ossConfig = {
      region: stsConfig.region,
      accessKeyId: stsConfig.Credentials.AccessKeyId,
      accessKeySecret: stsConfig.Credentials.AccessKeySecret,
      stsToken: stsConfig.Credentials.SecurityToken,
      bucket: stsConfig.bucket,
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
    this.store = oss(ossConfig);
    yield cleanBucket(this.store);
  });
  describe('endpoint', () => {
    it('should init with region', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou.aliyuncs.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou-internal.aliyuncs.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
        secure: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://oss-cn-hangzhou-internal.aliyuncs.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-beijing',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-beijing.aliyuncs.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-shenzhen',
        internal: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-shenzhen.aliyuncs.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://vpc100-oss-cn-hangzhou.aliyuncs.com/',
      );
    });

    it('should init with cname: foo.bar.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://foo.bar.com',
        cname: true,
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/',
      );
    });

    it('should init with endpoint: http://test.oss.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://test.oss.com',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/',
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'https://test.oss.com',
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://test.oss.com/',
      );
    });

    it('should init with ip address: http://127.0.0.1', () => {
      const store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: '127.0.0.1',
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://127.0.0.1/',
      );
    });

    it('should create request url with bucket', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      let params = {
        bucket: 'gems',
      };

      let url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com',
      });

      params = {
        bucket: 'gems',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true,
      });

      params = {
        bucket: 'gems',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:6000',
      });

      params = {
        bucket: 'gems',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:6000/gems/');
    });

    it('should create request url with bucket/object/subres', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
      });

      let params = {
        bucket: 'gems',
        object: 'hello',
      };

      let url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello');

      params = {
        bucket: 'gems',
        object: 'hello',
        subres: { acl: '', mime: '' },
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello?acl=&mime=');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com',
      });

      params = {
        bucket: 'gems',
        object: 'hello',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/hello');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true,
      });

      params = {
        bucket: 'gems',
        object: 'hello',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/hello');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:3000',
      });

      params = {
        bucket: 'gems',
        object: 'hello',
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:3000/gems/hello');
    });

    it('should set User-Agent', () => {
      const store = oss(ossConfig);
      const { userAgent } = store;

      assert(userAgent.startsWith(`aliyun-sdk-js/${pkg.version} ${platform.description}`));
    });

    it('should check beta or alpha User-Agent', () => {
      const store = oss(ossConfig);
      const uaBeta = store._checkUserAgent('aliyun-sdk-nodejs/4.12.2 Node.js β-8.4.0 on darwin x64');
      assert.equal(uaBeta, 'aliyun-sdk-nodejs/4.12.2 Node.js beta-8.4.0 on darwin x64');
      const uaAlpha = store._checkUserAgent('aliyun-sdk-nodejs/4.12.2 Node.js α-8.4.0 on darwin x64');
      assert.equal(uaAlpha, 'aliyun-sdk-nodejs/4.12.2 Node.js alpha-8.4.0 on darwin x64');
    });


    it('should trim access id/key', () => {
      const store = oss({
        accessKeyId: '  \tfoo\t\n  ',
        accessKeySecret: '  \tbar\n\r   ',
        region: 'oss-cn-hangzhou',
      });

      assert.equal(store.options.accessKeyId, 'foo');
      assert.equal(store.options.accessKeySecret, 'bar');
    });
  });

  describe('list()', () => {
    // oss.jpg
    // fun/test.jpg
    // fun/movie/001.avi
    // fun/movie/007.avi
    before(function* () {
      this.store = oss(ossConfig);
      const listPrefix = `${prefix}ali-sdk/list/`;
      yield this.store.put(`${listPrefix}oss.jpg`, new Buffer('oss.jpg'));
      yield this.store.put(`${listPrefix}fun/test.jpg`, new Buffer('fun/test.jpg'));
      yield this.store.put(`${listPrefix}fun/movie/001.avi`, new Buffer('fun/movie/001.avi'));
      yield this.store.put(`${listPrefix}fun/movie/007.avi`, new Buffer('fun/movie/007.avi'));
      yield this.store.put(`${listPrefix}other/movie/007.avi`, new Buffer('other/movie/007.avi'));
      yield this.store.put(`${listPrefix}other/movie/008.avi`, new Buffer('other/movie/008.avi'));
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
      const result = yield this.store.list({
        'max-keys': 1,
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list top 3 objects', function* () {
      const result = yield this.store.list({
        'max-keys': 3,
      });
      assert.equal(result.objects.length, 3);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);

      // next 2
      const result2 = yield this.store.list({
        'max-keys': 2,
        marker: result.nextMarker,
      });
      assert.equal(result2.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result2.nextMarker, 'string');
      assert(result2.isTruncated);
      assert.equal(result2.prefixes, null);
    });

    it('should list with prefix', function* () {
      let result = yield this.store.list({
        prefix: `${this.listPrefix}fun/movie/`,
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);

      result = yield this.store.list({
        prefix: `${this.listPrefix}fun/movie`,
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list current dir files only', function* () {
      let result = yield this.store.list({
        prefix: this.listPrefix,
        delimiter: '/',
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${this.listPrefix}fun/`, `${this.listPrefix}other/`]);

      result = yield this.store.list({
        prefix: `${this.listPrefix}fun/`,
        delimiter: '/',
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${this.listPrefix}fun/movie/`]);

      result = yield this.store.list({
        prefix: `${this.listPrefix}fun/movie/`,
        delimiter: '/',
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });
  });

  describe('put', () => {
    before(function* () {
      this.store = oss(ossConfig);
    });
    it('GETs and PUTs objects to a bucket', function* () {
      const name = `${prefix}put/test`;
      const body = new Buffer('body');
      const resultPut = yield this.store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      const resultGet = yield this.store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), body.toString());

      const resultDel = yield this.store.delete(name);
      assert.equal(resultDel.res.status, 204);
    });
    it('GETs and PUTs blob to a bucket', function* () {
      const name = `${prefix}put/test`;
      const body = new Blob(['blobBody'], { type: 'text/plain' });
      const resultPut = yield this.store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      const resultGet = yield this.store.get(name);
      assert.equal(resultGet.res.status, 200);


      yield new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = function () {
          assert.equal(resultGet.content.toString(), fr.result);
          resolve();
        };
        fr.readAsText(body, 'utf-8');
      });

      const resultDel = yield this.store.delete(name);
      assert.equal(resultDel.res.status, 204);
    });
  });

  describe('signatureUrl()', () => {
    before(function* () {
      this.store = oss(ossConfig);
      this.name = `${prefix}ali-sdk/oss/signatureUrl.js`;
      let object = yield this.store.put(this.name, new Buffer('signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html',
        },
      });
      assert.equal(object.res.status, 200);
      // 不允许跨域获取 x-oss-request-id
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      // this.headers = object.res.headers;

      this.needEscapeName = `${prefix}ali-sdk/oss/%3get+meta-signatureUrl.js`;
      object = yield this.store.put(this.needEscapeName, new Buffer('%3get+meta-signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html',
        },
      });
      assert.equal(object.res.status, 200);
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should signature url get object ok', function* () {
      const result = yield this.store.get(this.name);
      const url = this.store.signatureUrl(this.name);
      const urlRes = yield urllib.request(url);
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
      const putString = 'Hello World';
      const contentMd5 = crypto1
        .createHash('md5')
        .update(new Buffer(putString, 'utf8'))
        .digest('base64');
      console.log(contentMd5);
      const url = this.store.signatureUrl(this.name, {
        method: 'PUT',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Md5': contentMd5,
      });
      const headers = {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-MD5': contentMd5,
      };
      const res = yield urllib.request(url, { method: 'PUT', data: putString, headers });
      assert.equal(res.status, 200);
      const headRes = yield this.store.head(this.name);
      assert.equal(headRes.status, 200);
    });

    it('should signature url get need escape object ok', function* () {
      const result = yield this.store.get(this.needEscapeName);
      const url = this.store.signatureUrl(this.needEscapeName);
      const urlRes = yield urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    it('should signature url with reponse limitation', function* () {
      const response = {
        'content-type': 'xml',
        'content-language': 'zh-cn',
      };
      const url = this.store.signatureUrl(this.name, { response });
      assert(url.indexOf('response-content-type=xml') !== -1);
      assert(url.indexOf('response-content-language=zh-cn') !== -1);
    });

    it('should signature url with custom host ok', function () {
      const store = oss(Object.assign({}, ossConfig, {
        endpoint: 'www.aliyun.com',
        cname: true,
      }));

      const url = store.signatureUrl(this.name);
      // http://www.aliyun.com/darwin-v4.4.2/ali-sdk/oss/get-meta.js?OSSAccessKeyId=
      assert.equal(url.indexOf('http://www.aliyun.com/'), 0);
    });
  });

  describe('multipart', () => {
    before(function* () {
      this.store = oss(ossConfig);
    });

    describe('listUploads()', () => {
      beforeEach(function* () {
        const result = yield this.store.listUploads({
          'max-uploads': 1000,
        });
        const uploads = result.uploads || [];
        for (let i = 0; i < uploads.length; i++) {
          const up = uploads[i];
          yield this.store.abortMultipartUpload(up.name, up.uploadId);
        }
      });

      it('should list by key marker', function* () {
        const name = `${prefix}multipart/list-key`;
        // var name = '/'
        const ids = [];
        for (let i = 0; i < 5; i++) {
          const init = yield this.store.initMultipartUpload(name + i);
          ids.push(init.uploadId);
        }
        // list all uploads
        let result = yield this.store.listUploads({
          'max-uploads': 10,
        });
        const all = result.uploads.map(up => up.uploadId);
        assert.deepEqual(all, ids);

        // after 1
        result = yield this.store.listUploads({
          'max-uploads': 10,
          'key-marker': name + 0,
        });
        const after1 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after1, ids.slice(1));
        //
        // // after 5
        result = yield this.store.listUploads({
          'max-uploads': 10,
          'key-marker': name + 4,
        });
        const after5 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after5.length, 0);
      });

      it('should list by id marker', function* () {
        const name = `${prefix}multipart/list-id`;
        const ids = [];
        for (let i = 0; i < 5; i++) {
          const init = yield this.store.initMultipartUpload(name);
          ids.push(init.uploadId);
        }
        ids.sort();
        // list all uploads
        let result = yield this.store.listUploads({
          'max-uploads': 10,
        });
        const all = result.uploads.map(up => up.uploadId);
        assert.deepEqual(all, ids);
        // after 1: upload id marker alone is ignored
        result = yield this.store.listUploads({
          'max-uploads': 10,
          'upload-id-marker': ids[1],
        });
        const after1 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after1, ids);

        // after 5: upload id marker alone is ignored
        result = yield this.store.listUploads({
          'max-uploads': 10,
          'upload-id-marker': ids[4],
        });
        const after5 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after5, ids);
      });
      //
      it('should list by id & key marker', function* () {
        const fooName = `${prefix}multipart/list-foo`;
        const fooIds = [];
        for (let i = 0; i < 5; i++) {
          const init = yield this.store.initMultipartUpload(fooName);
          fooIds.push(init.uploadId);
        }
        fooIds.sort();

        const barName = `${prefix}multipart/list-bar`;
        const barIds = [];
        for (let i = 0; i < 5; i++) {
          const result = yield this.store.initMultipartUpload(barName);
          barIds.push(result.uploadId);
        }
        barIds.sort();

        // after 1
        const result = yield this.store.listUploads({
          'max-uploads': 10,
          'key-marker': barName,
          'upload-id-marker': barIds[0],
        });
        const after1 = result.uploads.map(up => up.uploadId);
        after1.sort();
        const should = barIds.slice(1).concat(fooIds).sort();
        assert.deepEqual(after1, should);

        // after 5
        const result5 = yield this.store.listUploads({
          'max-uploads': 10,
          'key-marker': barName,
          'upload-id-marker': barIds[4],
        });
        const after5 = result5.uploads.map(up => up.uploadId);
        assert.deepEqual(after5, fooIds);
      });
    });

    describe('multipartUpload()', () => {
      it.skip('should initMultipartUpload with x-oss-server-side-encryption', function* () {
        // wait server bucket cors on line
        const name = 'multipart-x-oss-server-side-encryption';
        const result = yield this.store.initMultipartUpload(name, {
          headers: {
            'x-oss-server-side-encryption': 'AES256',
          },
        });

        assert.equal(result.res.headers['x-oss-server-side-encryption'], 'AES256');
      });

      it('should fallback to putStream when file size is smaller than 100KB', function* () {
        const file = new File(['multipart-fallback-test'], 'multipart-fallback');
        const name = `${prefix}multipart/fallback`;
        let progress = 0;
        const putStreamSpy = sinon.spy(this.store, 'putStream');
        const uploadPartSpy = sinon.spy(this.store, '_uploadPart');
        const result = yield this.store.multipartUpload(name, file, {
          progress() {
            return function (done) {
              progress++;
              done();
            };
          },
        });
        assert.equal(putStreamSpy.callCount, 1);
        assert.equal(uploadPartSpy.callCount, 0);
        assert.equal(typeof result.name, 'string');
        assert.equal(typeof result.bucket, 'string');
        assert.equal(typeof result.etag, 'string');

        assert.equal(progress, 1);
        this.store.putStream.restore();
        this.store._uploadPart.restore();
      });

      it('should use default partSize when not specified', function* () {
        const partSize = this.store._getPartSize(1024 * 1024, null);
        assert.equal(partSize, 1 * 1024 * 1024);
      });

      it('should use user specified partSize', function* () {
        const partSize = this.store._getPartSize(1024 * 1024, 200 * 1024);
        assert.equal(partSize, 200 * 1024);
      });

      it('should not exceeds max part number', function* () {
        const fileSize = 10 * 1024 * 1024 * 1024;
        const maxNumParts = 10 * 1000;

        const partSize = this.store._getPartSize(fileSize, 100 * 1024);
        assert.equal(partSize, Math.ceil(fileSize / maxNumParts));
      });

      it('should upload file using multipart upload', function* () {
        // create a file with 1M random data
        // var fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-fallback');

        const name = `${prefix}multipart/upload-file.js`;
        let progress = 0;
        const result = yield this.store.multipartUpload(name, file, {
          partSize: 100 * 1024,
          progress() {
            return function (done) {
              progress++;
              done();
            };
          },
        });
        sinon.restore();
        assert.equal(result.res.status, 200);
        assert.equal(progress, 12);

        const object = yield this.store.get(name);
        assert.equal(object.res.status, 200);

        const fileBuf = new Uint8Array(fileContent.length);
        for (let i = 0, j = fileContent.length; i < j; ++i) {
          fileBuf[i] = fileContent.charCodeAt(i);
        }

        assert.equal(object.content.length, fileBuf.length);
        // avoid comparing buffers directly for it may hang when generating diffs
        assert.deepEqual(md5(object.content), md5(fileBuf));
      });

      it('should upload file using multipart upload', function* () {
        // create a file with 1M random data
        const blobContent = Array(1024 * 1024).fill('a').join('');
        const blob = new Blob([blobContent], { type: 'text/plain' });

        const name = `${prefix}multipart/upload-blob.js`;
        let progress = 0;
        const result = yield this.store.multipartUpload(name, blob, {
          partSize: 100 * 1024,
          progress() {
            return function (done) {
              progress++;
              done();
            };
          },
        });
        sinon.restore();
        assert.equal(result.res.status, 200);
        assert.equal(progress, 12);

        const object = yield this.store.get(name);
        assert.equal(object.res.status, 200);

        const blobBuf = new Uint8Array(blobContent.length);
        for (let i = 0, j = blobContent.length; i < j; ++i) {
          blobBuf[i] = blobContent.charCodeAt(i);
        }

        assert.equal(object.content.length, blobBuf.length);
        // avoid comparing buffers directly for it may hang when generating diffs
        assert.deepEqual(md5(object.content), md5(blobBuf));
      });

      it('should return requestId in init, upload part, complete', function* () {
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-fallback');
        const name = `${prefix}multipart/fallback`;
        const result = yield this.store.multipartUpload(name, file, {
          progress(p, checkpoint, res) {
            return function (done) {
              assert.equal(true, res && Object.keys(res).length !== 0);
              done();
            };
          },
        });
        assert.equal(true, result.res && Object.keys(result.res).length !== 0);
        assert.equal(result.res.status, 200);
      });

      it('should upload file using multipart upload with exception', function* () {
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-exception`;

        const stubUploadPart = sinon.stub(this.store, '_uploadPart');
        const testUploadPartException = new Error();
        testUploadPartException.name = 'TestUploadPartException';
        testUploadPartException.status = 403;
        stubUploadPart.throws(testUploadPartException);

        let errorMsg = '';
        let partNumz = 0;
        let errStatus = 0;
        try {
          yield this.store.multipartUpload(name, file, {
            progress() {
              return function (done) {
                done();
              };
            },
            partSize: 100 * 1024,
          });
        } catch (err) {
          errorMsg = err.message;
          partNumz = err.partNum;
          errStatus = err.status;
        }
        assert.equal(
          errorMsg,
          'Failed to upload some parts with error: TestUploadPartException part_num: 1',
        );
        assert.equal(partNumz, 1);
        assert.equal(errStatus, 403);
        this.store._uploadPart.restore();
      });

      // multipart cancel test
      it('should upload file with cancel', function* () {
        const client = this.store;
        // create a file with 1M random data
        const fileContent = Array(1 * 1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-cancel`;

        let tempCheckpoint = null;
        const options = {
          progress(p, checkpoint) {
            return function (done) {
              tempCheckpoint = checkpoint;
              if (p > 0.5) {
                client.cancel();
              }
              done();
            };
          },
          partSize: 100 * 1024,
        };
        try {
          yield client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }

        assert.equal(true, tempCheckpoint && Object.keys(tempCheckpoint).length !== 0);

        const options2 = {
          progress(p) {
            return function (done) {
              assert.equal(true, p > 0.5);
              done();
            };
          },
          partSize: 100 * 1024,
          checkpoint: tempCheckpoint,
        };
        const result = yield client.multipartUpload(name, file, options2);

        assert.equal(result.res.status, 200);
      });

      it('should multipart upload file with abort', function* () {
        const client = this.store;
        // create a file with 1M random data
        const fileContent = Array(1 * 1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-cancel`;
        let uploadIdz = null;
        const options = {
          progress(p, checkpoint) {
            return function (done) {
              if (p === 0) {
                uploadIdz = checkpoint.uploadId;
              }
              if (p > 0.5) {
                co(function* () {
                  yield client.abortMultipartUpload(name, uploadIdz);
                });
              }
              done();
            };
          },
          partSize: 100 * 1024,
        };
        try {
          yield client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }
      });

      it('should upload with uploadPart', function* () {
        const fileContent = Array(10 * 100 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-part');

        const name = `${prefix}multipart/upload-part-file.js`;
        const init = yield this.store.initMultipartUpload(name);
        const { uploadId } = init;
        const partSize = 100 * 1024;
        const dones = [];
        for (let i = 1; i <= 10; i++) {
          const start = (i - 1) * partSize;
          const end = Math.min(i * partSize, file.size);
          const part = yield this.store.uploadPart(name, uploadId, i, file, start, end);
          dones.push({
            number: i,
            etag: part.res.headers.etag,
          });
        }

        const result = yield this.store.completeMultipartUpload(name, uploadId, dones);
        assert.equal(result.res.status, 200);
      });

      it('should upload with list part', function* () {
        const client = this.store;
        // create a file with 1M random data
        const fileContent = Array(1 * 1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-list-part');

        const name = `${prefix}multipart/upload-list-part`;

        let uploadIdz = null;
        const options = {
          progress(p, checkpoint) {
            return function (done) {
              if (p === 0) {
                uploadIdz = checkpoint.uploadId;
              }
              if (p > 0.5) {
                client.cancel();
              }
              done();
            };
          },
          partSize: 100 * 1024,
        };
        /* eslint no-empty: [0] */
        try {
          yield client.multipartUpload(name, file, options);
        } catch (err) {
        }

        const result = yield this.store.listParts(name, uploadIdz, {
          'max-parts': 1000,
        }, {});

        assert.equal(result.res.status, 200);
      });

      it('should upload no more 100k file with callback server', function* () {
        const fileContent = Array(50 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-callback-server');
        const name = `${prefix}multipart/callback-server`;
        const result = yield this.store.multipartUpload(name, file, {
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

      it('should multipart upload file with callback server', function* () {
        const fileContent = Array(1 * 1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-callback-server');
        const name = `${prefix}multipart/callback-server`;
        const result = yield this.store.multipartUpload(name, file, {
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

      it('should upload file with cancel and callback', function* () {
        const client = this.store;
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-cancel-callback`;

        let tempCheckpoint = null;
        const options = {
          progress(p, checkpoint) {
            return function (done) {
              tempCheckpoint = checkpoint;
              if (p > 0.5) {
                client.cancel();
              }
              done();
            };
          },
          partSize: 100 * 1024,
          callback: {
            url: 'http://oss-demo.aliyuncs.com:23450',
            host: 'oss-cn-hangzhou.aliyuncs.com',
            /* eslint no-template-curly-in-string: [0] */
            body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
            contentType: 'application/x-www-form-urlencoded',
            customValue: {
              var1: 'value1',
              var2: 'value2',
            },
          },
        };
        try {
          yield client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }

        assert.equal(true, tempCheckpoint && Object.keys(tempCheckpoint).length !== 0);

        const options2 = {
          progress(p) {
            return function (done) {
              assert.equal(true, p > 0.5);
              done();
            };
          },
          partSize: 100 * 1024,
          checkpoint: tempCheckpoint,
          callback: {
            url: 'http://oss-demo.aliyuncs.com:23450',
            host: 'oss-cn-hangzhou.aliyuncs.com',
            /* eslint no-template-curly-in-string: [0] */
            body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
            contentType: 'application/x-www-form-urlencoded',
            customValue: {
              var1: 'value1',
              var2: 'value2',
            },
          },
        };
        const result = yield client.multipartUpload(name, file, options2);

        assert.equal(result.res.status, 200);
      });
    });
  });

  describe('request time is skew', () => {
    before(function* () {
      this.store = oss(ossConfig);
    });
    it('When the client\'s date is skew, the request will calibration time and retry', function* () {
      const name = `${prefix}put/skew_date`;
      const body = new Buffer('body');
      const requestSpy = sinon.spy(this.store, 'request');
      const requestErrorSpy = sinon.spy(this.store, 'requestError');

      timemachine.config({
        dateString: 'December 25, 1991 13:12:59',
        tick: true,
      });
      const resultPut = yield this.store.put(name, body);
      assert.equal(resultPut.res.status, 200);

      assert.equal(requestSpy.callCount, 2);
      assert.equal(requestErrorSpy.callCount, 1);

      const resultGet = yield this.store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), body.toString());

      const resultDel = yield this.store.delete(name);
      assert.equal(resultDel.res.status, 204);
      timemachine.reset();
    });
  });

  describe('requestErr()', () => {
    before(function* () {
      const ossConfigz = {
        region: stsConfig.region,
        accessKeyId: stsConfig.Credentials.AccessKeyId,
        accessKeySecret: stsConfig.Credentials.AccessKeySecret,
        stsToken: stsConfig.Credentials.SecurityToken,
        bucket: stsConfig.bucket,
        timeout: 1,
      };
      this.store = oss(ossConfigz);
    });
    it('should request timeout exception', function* () {
      const fileContent = Array(1024 * 1024).fill('a').join('');
      const file = new File([fileContent], 'multipart-upload-file');

      const name = `${prefix}multipart/upload-file-timeout`;

      let timeoutErr;
      try {
        yield this.store.multipartUpload(name, file);
      } catch (err) {
        timeoutErr = err;
      }
      assert.equal(true, timeoutErr && Object.keys(timeoutErr).length !== 0);
      assert.equal(timeoutErr.status, -2);
    });

    it('should request net exception', function* () {
      const fileContent = Array(1024 * 1024).fill('a').join('');
      const file = new File([fileContent], 'multipart-upload-file');

      const name = `${prefix}multipart/upload-file-timeout`;
      const stubNetError = sinon.stub(this.store.urllib, 'request');
      const netErr = new Error('TestNetErrorException');
      netErr.status = -1;
      netErr.code = 'RequestError';
      netErr.name = 'RequestError';
      stubNetError.throws(netErr);
      let netErrz;
      try {
        yield this.store.multipartUpload(name, file);
      } catch (err) {
        netErrz = err;
      }
      assert.equal(true, netErrz && Object.keys(netErrz).length !== 0);
      assert.equal(netErrz.status, -1);

      this.store.urllib.request.restore();
    });
  });
});
