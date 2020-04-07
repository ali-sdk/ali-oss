
/* eslint no-await-in-loop: [0] */
const assert = require('assert');
// var oss = require('../');
// var oss = OSS.Wrapper;
/* eslint no-undef: [0] */
const oss = OSS;
// var sts = oss.STS;
const urllib = require('urllib');
const sinon = require('sinon');
const md5 = require('crypto-js/md5');
/* eslint import/no-unresolved: [0] */
const stsConfig = require('./.tmp/stsConfig.json');
const pkg = require('../../package.json');
const platform = require('platform');
// const { callbackServer } = require('../../test/const');

const crypto1 = require('crypto');
const { prefix } = require('./browser-utils');

let ossConfig;
const timemachine = require('timemachine');

timemachine.reset();

const cleanBucket = async (store) => {
  let result = await store.list({
    'max-keys': 1000
  });
  result.objects = result.objects || [];
  for (let i = 0; i < result.objects.length; i++) {
    const obj = result.objects[i];
    await store.delete(obj.name);
  }

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    await store.abortMultipartUpload(up.name, up.uploadId);
  }
};

describe('browser', () => {
  /* eslint require-yield: [0] */
  before(() => {
    ossConfig = {
      region: stsConfig.region,
      accessKeyId: stsConfig.Credentials.AccessKeyId,
      accessKeySecret: stsConfig.Credentials.AccessKeySecret,
      stsToken: stsConfig.Credentials.SecurityToken,
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
  after(async () => {
    const store = oss(ossConfig);
    await cleanBucket(store);
  });

  describe('endpoint', () => {
    it('should init with region', () => {
      console.log('xxx');
    });
    it('should init with region', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou.aliyuncs.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://oss-cn-hangzhou-internal.aliyuncs.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://oss-cn-hangzhou-internal.aliyuncs.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-beijing'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-beijing.aliyuncs.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-shenzhen',
        internal: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://vpc100-oss-cn-shenzhen.aliyuncs.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://vpc100-oss-cn-hangzhou.aliyuncs.com/'
      );
    });

    it('should init with cname: foo.bar.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://foo.bar.com',
        cname: true
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://foo.bar.com/'
      );
    });

    it('should init with endpoint: http://test.oss.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        secure: true,
        endpoint: 'test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://test.oss.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://test.oss.com/'
      );

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'https://test.oss.com'
      });

      assert.equal(
        store.options.endpoint.format(),
        'https://test.oss.com/'
      );
    });

    it('should init with ip address: http://127.0.0.1', () => {
      const store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: '127.0.0.1'
      });

      assert.equal(
        store.options.endpoint.format(),
        'http://127.0.0.1/'
      );
    });

    it('should create request url with bucket', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou'
      });

      let params = {
        bucket: 'gems'
      };

      let url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      params = {
        bucket: 'gems'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      params = {
        bucket: 'gems'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:6000'
      });

      params = {
        bucket: 'gems'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:6000/gems/');
    });

    it('should create request url with bucket/object/subres', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou'
      });

      let params = {
        bucket: 'gems',
        object: 'hello'
      };

      let url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello');

      params = {
        bucket: 'gems',
        object: 'hello',
        subres: { acl: '', mime: '' }
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.oss-cn-hangzhou.aliyuncs.com/hello?acl=&mime=');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      params = {
        bucket: 'gems',
        object: 'hello'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://gems.test.oss.com/hello');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      params = {
        bucket: 'gems',
        object: 'hello'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://foo.bar.com/hello');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://127.0.0.1:3000'
      });

      params = {
        bucket: 'gems',
        object: 'hello'
      };

      url = store._getReqUrl(params);
      assert.equal(url, 'http://127.0.0.1:3000/gems/hello');
    });

    it('should set User-Agent', () => {
      const store = oss(ossConfig);
      const { userAgent } = store;

      assert(userAgent.indexOf(`aliyun-sdk-js/${pkg.version} ${platform.description}`) === 0);
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
        region: 'oss-cn-hangzhou'
      });

      assert.equal(store.options.accessKeyId, 'foo');
      assert.equal(store.options.accessKeySecret, 'bar');
    });

    // 默认获取useFetch为true,设置为false后，简单确认为false
    it('should check useFetch option', () => {
      const store1 = oss({
        accessKeyId: 'hi-oss-check-key-id',
        accessKeySecret: 'hi-oss-check-key-id-secret',
        region: 'oss-cn-hangzhou'
      });
      assert.equal(store1.options.useFetch, false);
      const store2 = oss({
        accessKeyId: 'hi-oss-check-key-id',
        accessKeySecret: 'hi-oss-check-key-id-secret',
        region: 'oss-cn-hangzhou',
        useFetch: true
      });
      assert.equal(store2.options.useFetch, true);
    });
  });

  describe('list()', () => {
    let client;
    let listPrefix;
    // oss.jpg
    // fun/test.jpg
    // fun/movie/001.avi
    // fun/movie/007.avi
    before(async () => {
      client = oss(ossConfig);
      listPrefix = `${prefix}ali-sdk/list/`;
      await client.put(`${listPrefix}oss.jpg`, Buffer.from('oss.jpg'));
      await client.put(`${listPrefix}fun/test.jpg`, Buffer.from('fun/test.jpg'));
      await client.put(`${listPrefix}fun/movie/001.avi`, Buffer.from('fun/movie/001.avi'));
      await client.put(`${listPrefix}fun/movie/007.avi`, Buffer.from('fun/movie/007.avi'));
      await client.put(`${listPrefix}other/movie/007.avi`, Buffer.from('other/movie/007.avi'));
      await client.put(`${listPrefix}other/movie/008.avi`, Buffer.from('other/movie/008.avi'));
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

    it('should list only 1 object', async () => {
      const result = await client.list({
        'max-keys': 1
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list top 3 objects', async () => {
      const result = await client.list({
        'max-keys': 3
      });
      assert.equal(result.objects.length, 3);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);

      // next 2
      const result2 = await client.list({
        'max-keys': 2,
        marker: result.nextMarker
      });
      assert.equal(result2.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result2.nextMarker, 'string');
      assert(result2.isTruncated);
      assert.equal(result2.prefixes, null);
    });

    it('should list with prefix', async () => {
      let result = await client.list({
        prefix: `${listPrefix}fun/movie/`
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);

      result = await client.list({
        prefix: `${listPrefix}fun/movie`
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list current dir files only', async () => {
      let result = await client.list({
        prefix: listPrefix,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/`, `${listPrefix}other/`]);

      result = await client.list({
        prefix: `${listPrefix}fun/`,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/movie/`]);

      result = await client.list({
        prefix: `${listPrefix}fun/movie/`,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });
  });

  describe('put', () => {
    let store;
    before(() => {
      store = oss(ossConfig);
    });
    it('GETs and PUTs objects to a bucket', async () => {
      const name = `${prefix}put/test`;
      const body = Buffer.from('body');
      const resultPut = await store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      const resultGet = await store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), body.toString());

      const resultDel = await store.delete(name);
      assert.equal(resultDel.res.status, 204);
    });
    it('GETs and PUTs blob to a bucket', async () => {
      const name = `${prefix}put/test`;
      const body = new Blob(['blobBody'], { type: 'text/plain' });
      const resultPut = await store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      const resultGet = await store.get(name);
      assert.equal(resultGet.res.status, 200);


      await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = function () {
          assert.equal(resultGet.content.toString(), fr.result);
          resolve();
        };
        fr.readAsText(body, 'utf-8');
      });

      const resultDel = await store.delete(name);
      assert.equal(resultDel.res.status, 204);
    });

    it('PUTs object with same name to a bucket', async () => {
      const body = Buffer.from('san');
      const name = `${prefix}put/testsan`;
      const resultPut = await store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      try {
        await store.put(name, body, {
          headers: { 'x-oss-forbid-overwrite': 'true' }
        });
      } catch (error) {
        assert(true);
      }
    });
  });

  describe('copy()', () => {
    let name;
    // let resHeaders;
    // const otherBucket = '';
    // let otherBucketObject;
    let store;
    before(async () => {
      name = `${prefix}ali-sdk/oss/copy-meta.js`;
      store = oss(ossConfig);
      const object = await store.put(name, Buffer.from('abc'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should copy object from same bucket', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new.js`;
      const result = await store.copy(originname, name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      const info = await store.head(originname);
      // Must set CORS
      // assert.equal(info.meta.uid, '1');
      // assert.equal(info.meta.pid, '123');
      // assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });

    it.skip('should copy object from other bucket, sourceBucket in copySource', async () => {
      const copySource = `/${otherBucket}/${otherBucketObject}`;
      const copyTarget = `${prefix}ali-sdk/oss/copy-target.js`;
      const result = await store.copy(copyTarget, copySource);
      assert.equal(result.res.status, 200);

      const info = await store.head(copyTarget);
      assert.equal(info.status, 200);
    });

    it.skip('should copy object from other bucket, sourceBucket is a separate parameter', async () => {
      const copySource = otherBucketObject;
      const copyTarget = `${prefix}ali-sdk/oss/has-bucket-name-copy-target.js`;
      const result = await store.copy(copyTarget, copySource, otherBucket);
      assert.equal(result.res.status, 200);

      const info = await store.head(copyTarget);
      assert.equal(info.status, 200);
    });

    it('should copy object with non-english name', async () => {
      const sourceName = `${prefix}ali-sdk/oss/copy-meta_测试.js`;
      let result = await store.put(sourceName, Buffer.from('abc'), {
        meta: {
          uid: 2,
          pid: '1234',
          slus: 'test1.html'
        }
      });

      const originname = `${prefix}ali-sdk/oss/copy-new_测试.js`;
      result = await store.copy(originname, sourceName);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      const info = await store.head(originname);
      // Must set CORS
      // assert.equal(info.meta.uid, '2');
      // assert.equal(info.meta.pid, '1234');
      // assert.equal(info.meta.slus, 'test1.html');
      assert.equal(info.status, 200);
    });

    it.skip('should copy object with non-english name and bucket', async () => {
      let sourceName = `${prefix}ali-sdk/oss/copy-meta_测试2.js`;
      let result = await store.put(sourceName, __filename, {
        meta: {
          uid: 3,
          pid: '12345',
          slus: 'test2.html'
        }
      });

      let info = await store.head(sourceName);
      assert.equal(info.meta.uid, '3');
      assert.equal(info.meta.pid, '12345');
      assert.equal(info.meta.slus, 'test2.html');
      assert.equal(info.status, 200);

      sourceName = `/${bucket}/${sourceName}`;
      const originname = `${prefix}ali-sdk/oss/copy-new_测试2.js`;
      result = await store.copy(originname, sourceName);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      info = await store.head(originname);
      // Must set CORS
      // assert.equal(info.meta.uid, '3');
      // assert.equal(info.meta.pid, '12345');
      // assert.equal(info.meta.slus, 'test2.html');
      assert.equal(info.status, 200);
    });

    it('should copy object and set other meta', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new-2.js`;
      const result = await store.copy(originname, name, {
        meta: {
          uid: '2'
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      const info = await store.head(originname);
      // Must set CORS
      // assert.equal(info.meta.uid, '2');
      // assert(!info.meta.pid);
      // assert(!info.meta.slus);
      assert.equal(info.status, 200);
    });

    it('should use copy to change exists object headers', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new-3.js`;
      let result = await store.copy(originname, name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');
      let info = await store.head(originname);
      assert(!info.res.headers['cache-control']);

      // add Cache-Control header to a exists object
      result = await store.copy(originname, originname, {
        headers: {
          'Cache-Control': 'max-age=0, s-maxage=86400'
        }
      });
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');
      info = await store.head(originname);
      assert.equal(info.res.headers['cache-control'], 'max-age=0, s-maxage=86400');
    });
  });

  describe('signatureUrl()', () => {
    let store;
    let name;
    let needEscapeName;
    before(async () => {
      store = oss(ossConfig);
      name = `${prefix}ali-sdk/oss/signatureUrl.js`;
      let object = await store.put(name, Buffer.from('signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(object.res.status, 200);
      // 不允许跨域获取 x-oss-request-id
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      // this.headers = object.res.headers;

      needEscapeName = `${prefix}ali-sdk/oss/%3get+meta-signatureUrl.js`;
      object = await store.put(needEscapeName, Buffer.from('%3get+meta-signatureUrl'), {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(object.res.status, 200);
      // assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should signature url get object ok', async () => {
      const result = await store.get(name);
      const url = store.signatureUrl(name);
      const urlRes = await urllib.request(url);
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
    it('should signature url for PUT', async () => {
      const putString = 'Hello World';
      const contentMd5 = crypto1
        .createHash('md5')
        .update(Buffer.from(putString, 'utf8'))
        .digest('base64');
      console.log(contentMd5);
      const url = store.signatureUrl(name, {
        method: 'PUT',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Md5': contentMd5
      });
      const headers = {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-MD5': contentMd5
      };
      const res = await urllib.request(url, { method: 'PUT', data: putString, headers });
      assert.equal(res.status, 200);
      const headRes = await store.head(name);
      assert.equal(headRes.status, 200);
    });

    it('should signature url get need escape object ok', async () => {
      const result = await store.get(needEscapeName);
      const url = store.signatureUrl(needEscapeName);
      const urlRes = await urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    it('should signature url with reponse limitation', async () => {
      const response = {
        'content-type': 'xml',
        'content-language': 'zh-cn'
      };
      const url = store.signatureUrl(name, { response });
      assert(url.indexOf('response-content-type=xml') !== -1);
      assert(url.indexOf('response-content-language=zh-cn') !== -1);
    });

    it('should signature url with custom host ok', () => {
      const signatureStore = oss(Object.assign({}, ossConfig, {
        endpoint: 'www.aliyun.com',
        cname: true
      }));

      const url = signatureStore.signatureUrl(name);
      // http://www.aliyun.com/darwin-v4.4.2/ali-sdk/oss/get-meta.js?OSSAccessKeyId=
      assert.equal(url.indexOf('http://www.aliyun.com/'), 0);
    });
  });

  describe('multipart', () => {
    let store;
    before(() => {
      store = oss(ossConfig);
    });

    describe('listUploads()', () => {
      beforeEach(async () => {
        const result = await store.listUploads({
          'max-uploads': 1000
        });
        const uploads = result.uploads || [];
        for (let i = 0; i < uploads.length; i++) {
          const up = uploads[i];
          await store.abortMultipartUpload(up.name, up.uploadId);
        }
      });

      it('should list by key marker', async () => {
        const name = `${prefix}multipart/list-key`;
        // var name = '/'
        const ids = [];
        for (let i = 0; i < 5; i++) {
          const init = await store.initMultipartUpload(name + i);
          ids.push(init.uploadId);
        }
        // list all uploads
        let result = await store.listUploads({
          'max-uploads': 10
        });
        const all = result.uploads.map(up => up.uploadId);
        assert.deepEqual(all, ids);

        // after 1
        result = await store.listUploads({
          'max-uploads': 10,
          'key-marker': name + 0
        });
        const after1 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after1, ids.slice(1));
        //
        // // after 5
        result = await store.listUploads({
          'max-uploads': 10,
          'key-marker': name + 4
        });
        const after5 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after5.length, 0);
      });

      it('should list by id marker', async () => {
        const name = `${prefix}multipart/list-id`;
        const ids = [];
        for (let i = 0; i < 5; i++) {
          const init = await store.initMultipartUpload(name);
          ids.push(init.uploadId);
        }
        ids.sort();
        // list all uploads
        let result = await store.listUploads({
          'max-uploads': 10
        });
        const all = result.uploads.map(up => up.uploadId);
        assert.deepEqual(all, ids);
        // after 1: upload id marker alone is ignored
        result = await store.listUploads({
          'max-uploads': 10,
          'upload-id-marker': ids[1]
        });
        const after1 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after1, ids);

        // after 5: upload id marker alone is ignored
        result = await store.listUploads({
          'max-uploads': 10,
          'upload-id-marker': ids[4]
        });
        const after5 = result.uploads.map(up => up.uploadId);
        assert.deepEqual(after5, ids);
      });
      //
      it('should list by id & key marker', async () => {
        const fooName = `${prefix}multipart/list-foo`;
        const fooIds = [];
        for (let i = 0; i < 5; i++) {
          const init = await store.initMultipartUpload(fooName);
          fooIds.push(init.uploadId);
        }
        fooIds.sort();

        const barName = `${prefix}multipart/list-bar`;
        const barIds = [];
        for (let i = 0; i < 5; i++) {
          const result = await store.initMultipartUpload(barName);
          barIds.push(result.uploadId);
        }
        barIds.sort();

        // after 1
        const result = await store.listUploads({
          'max-uploads': 10,
          'key-marker': barName,
          'upload-id-marker': barIds[0]
        });
        const after1 = result.uploads.map(up => up.uploadId);
        after1.sort();
        const should = barIds.slice(1).concat(fooIds).sort();
        assert.deepEqual(after1, should);

        // after 5
        const result5 = await store.listUploads({
          'max-uploads': 10,
          'key-marker': barName,
          'upload-id-marker': barIds[4]
        });
        const after5 = result5.uploads.map(up => up.uploadId);
        assert.deepEqual(after5, fooIds);
      });
    });

    describe('multipartUpload()', () => {
      it('should initMultipartUpload with x-oss-server-side-encryption', async () => {
        // wait server bucket cors on line, this case need set cors exposed header x-oss-server-side-encryption with bucket
        const name = 'multipart-x-oss-server-side-encryption';
        const result = await store.initMultipartUpload(name, {
          headers: {
            'x-oss-server-side-encryption': 'AES256'
          }
        });

        assert.equal(result.res.headers['x-oss-server-side-encryption'], 'AES256');
      });

      it('should multipartUpload with x-oss-server-side-encryption', async () => {
        const name = 'multipart-x-oss-server-side-encryption';
        const fileContent = Array(1034 * 1024).fill('a').join('');
        const fileName = new File([fileContent], 'multipart-upload-kms');
        const result = await store.multipartUpload(name, fileName, {
          headers: {
            'x-oss-server-side-encryption': 'KMS'
          }
        });
        assert.equal(result.res.headers['x-oss-server-side-encryption'], 'KMS');
      });

      it('should fallback to putStream when file size is smaller than 100KB', async () => {
        const file = new File(['multipart-fallback-test'], 'multipart-fallback');
        const name = `${prefix}multipart/fallback`;
        let progress = 0;
        const putStreamSpy = sinon.spy(store, 'putStream');
        const uploadPartSpy = sinon.spy(store, '_uploadPart');
        const result = await store.multipartUpload(name, file, {
          progress() {
            progress++;
          }
        });
        assert.equal(putStreamSpy.callCount, 1);
        assert.equal(uploadPartSpy.callCount, 0);
        assert.equal(typeof result.name, 'string');
        assert.equal(typeof result.bucket, 'string');
        assert.equal(typeof result.etag, 'string');

        assert.equal(progress, 1);
        store.putStream.restore();
        store._uploadPart.restore();
      });

      it('should use default partSize when not specified', () => {
        const partSize = store._getPartSize(1024 * 1024, null);
        assert.equal(partSize, 1024 * 1024);
      });

      it('should use user specified partSize', () => {
        const partSize = store._getPartSize(1024 * 1024, 200 * 1024);
        assert.equal(partSize, 200 * 1024);
      });

      it('should not exceeds max part number', () => {
        const fileSize = 10 * 1024 * 1024 * 1024;
        const maxNumParts = 10 * 1000;

        const partSize = store._getPartSize(fileSize, 100 * 1024);
        assert.equal(partSize, Math.ceil(fileSize / maxNumParts));
      });

      it('should upload file using multipart upload', async () => {
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-fallback');

        const name = `${prefix}multipart/upload-file.js`;
        let progress = 0;
        const result = await store.multipartUpload(name, file, {
          partSize: 100 * 1024,
          progress() {
            progress++;
          }
        });
        sinon.restore();
        assert.equal(result.res.status, 200);
        assert.equal(progress, 12);

        const object = await store.get(name);
        assert.equal(object.res.status, 200);

        const fileBuf = new Uint8Array(fileContent.length);
        for (let i = 0, j = fileContent.length; i < j; ++i) {
          fileBuf[i] = fileContent.charCodeAt(i);
        }

        assert.equal(object.content.length, fileBuf.length);
        // avoid comparing buffers directly for it may hang when generating diffs
        assert.deepEqual(md5(object.content), md5(fileBuf));
      });

      it('should return requestId in init, upload part, complete', async () => {
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-fallback');
        const name = `${prefix}multipart/fallback`;
        const result = await store.multipartUpload(name, file, {
          progress(p, checkpoint, res) {
            assert.equal(true, res && Object.keys(res).length !== 0);
          }
        });
        assert.equal(true, result.res && Object.keys(result.res).length !== 0);
        assert.equal(result.res.status, 200);
      });

      it('should upload file using multipart upload with exception', async () => {
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-exception`;

        const stubUploadPart = sinon.stub(store, '_uploadPart');
        const testUploadPartException = new Error();
        testUploadPartException.name = 'TestUploadPartException';
        testUploadPartException.status = 403;
        stubUploadPart.throws(testUploadPartException);

        let errorMsg = '';
        let partNumz = 0;
        let errStatus = 0;
        try {
          await store.multipartUpload(name, file, {
            progress() {
            },
            partSize: 100 * 1024
          });
        } catch (err) {
          errorMsg = err.message;
          partNumz = err.partNum;
          errStatus = err.status;
        }
        store._uploadPart.restore();
        assert.equal(
          errorMsg,
          'Failed to upload some parts with error: TestUploadPartException part_num: 1'
        );
        assert.equal(partNumz, 1);
        assert.equal(errStatus, 403);
      });

      // multipart cancel test
      it('should upload file with cancel', async () => {
        const client = oss(ossConfig);
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-cancel`;

        let tempCheckpoint = null;
        const options = {
          progress(p, checkpoint) {
            tempCheckpoint = checkpoint;
            if (p > 0.5) {
              client.cancel();
            }
          },
          partSize: 100 * 1024
        };
        try {
          await client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }

        assert.equal(true, tempCheckpoint && Object.keys(tempCheckpoint).length !== 0);

        const options2 = {
          progress(p) {
            assert.equal(true, p > 0.5);
          },
          partSize: 100 * 1024,
          checkpoint: tempCheckpoint
        };

        const result = await client.multipartUpload(name, file, options2);

        assert.equal(result.res.status, 200);
      });

      it('should multipart upload file with abort', async () => {
        const client = store;
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-cancel`;
        let uploadIdz = null;
        const options = {
          async progress(p, checkpoint) {
            if (p === 0) {
              uploadIdz = checkpoint.uploadId;
            }
            if (p > 0.5) {
              await client.abortMultipartUpload(name, uploadIdz);
            }
          },
          partSize: 100 * 1024
        };
        try {
          await client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }
      });

      it('should upload with uploadPart', async () => {
        const fileContent = Array(10 * 100 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-part');

        const name = `${prefix}multipart/upload-part-file.js`;
        const init = await store.initMultipartUpload(name);
        const { uploadId } = init;
        const partSize = 100 * 1024;
        const dones = [];
        for (let i = 1; i <= 10; i++) {
          const start = (i - 1) * partSize;
          const end = Math.min(i * partSize, file.size);
          const part = await store.uploadPart(name, uploadId, i, file, start, end);
          dones.push({
            number: i,
            etag: part.res.headers.etag
          });
        }

        const result = await store.completeMultipartUpload(name, uploadId, dones);
        assert.equal(result.res.status, 200);
      });

      it('should upload with list part', async () => {
        const client = store;
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-upload-list-part');

        const name = `${prefix}multipart/upload-list-part`;

        let uploadIdz = null;
        const options = {
          progress(p, checkpoint) {
            if (p === 0) {
              uploadIdz = checkpoint.uploadId;
            }
            if (p > 0.5) {
              client.cancel();
            }
          },
          partSize: 100 * 1024
        };
        /* eslint no-empty: [0] */
        try {
          await client.multipartUpload(name, file, options);
        } catch (err) {
        }

        const result = await store.listParts(name, uploadIdz, {
          'max-parts': 1000
        }, {});

        assert.equal(result.res.status, 200);
      });

      // TODO fix callback server
      // it('should upload no more 100k file with callback server', async () => {
      //   const fileContent = Array(50 * 1024).fill('a').join('');
      //   const file = new File([fileContent], 'multipart-callback-server');
      //   const name = `${prefix}multipart/callback-server`;
      //   const result = await store.multipartUpload(name, file, {
      //     partSize: 100 * 1024,
      //     callback: {
      //       url: callbackServer,
      //       host: 'oss-cn-hangzhou.aliyuncs.com',
      //       /* eslint no-template-curly-in-string: [0] */
      //       body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
      //       contentType: 'application/x-www-form-urlencoded',
      //       customValue: {
      //         var1: 'value1',
      //         var2: 'value2'
      //       }
      //     }
      //   });
      //   assert.equal(result.res.status, 200);
      //   assert.equal(result.data.Status, 'OK');
      // });

      // TODO fix callback server
      // it('should multipart upload file with callback server', async () => {
      //   const fileContent = Array(1024 * 1024).fill('a').join('');
      //   const file = new File([fileContent], 'multipart-callback-server');
      //   const name = `${prefix}multipart/callback-server`;
      //   const result = await store.multipartUpload(name, file, {
      //     partSize: 100 * 1024,
      //     callback: {
      //       url: callbackServer,
      //       host: 'oss-cn-hangzhou.aliyuncs.com',
      //       body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
      //       contentType: 'application/x-www-form-urlencoded',
      //       customValue: {
      //         var1: 'value1',
      //         var2: 'value2'
      //       }
      //     }
      //   });
      //   assert.equal(result.res.status, 200);
      //   assert.equal(result.data.Status, 'OK');
      // });

      // TODO fix callback server
      // it('should upload file with cancel and callback', async () => {
      //   const client = oss(ossConfig);
      //   // create a file with 1M random data
      //   const fileContent = Array(1024 * 1024).fill('a').join('');
      //   const file = new File([fileContent], 'multipart-upload-file');
      //
      //   const name = `${prefix}multipart/upload-file-cancel-callback`;
      //
      //   let tempCheckpoint = null;
      //   const options = {
      //     progress(p, checkpoint) {
      //       tempCheckpoint = checkpoint;
      //       if (p > 0.5) {
      //         client.cancel();
      //       }
      //     },
      //     partSize: 100 * 1024,
      //     callback: {
      //       url: 'http://oss-demo.aliyuncs.com:23450',
      //       host: 'oss-cn-hangzhou.aliyuncs.com',
      //       /* eslint no-template-curly-in-string: [0] */
      //       body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
      //       contentType: 'application/x-www-form-urlencoded',
      //       customValue: {
      //         var1: 'value1',
      //         var2: 'value2'
      //       }
      //     }
      //   };
      //   try {
      //     await client.multipartUpload(name, file, options);
      //   } catch (err) {
      //     assert.equal(true, client.isCancel());
      //   }
      //
      //   assert.equal(true, tempCheckpoint && Object.keys(tempCheckpoint).length !== 0);
      //
      //   const options2 = {
      //     progress(p) {
      //       assert.equal(true, p > 0.5);
      //     },
      //     partSize: 100 * 1024,
      //     checkpoint: tempCheckpoint,
      //     callback: {
      //       url: 'http://oss-demo.aliyuncs.com:23450',
      //       host: 'oss-cn-hangzhou.aliyuncs.com',
      //       /* eslint no-template-curly-in-string: [0] */
      //       body: 'bucket=${bucket}&object=${object}&var1=${x:var1}',
      //       contentType: 'application/x-www-form-urlencoded',
      //       customValue: {
      //         var1: 'value1',
      //         var2: 'value2'
      //       }
      //     }
      //   };
      //   const result = await client.multipartUpload(name, file, options2);
      //
      //   assert.equal(result.res.status, 200);
      // });

      it('should upload partSize be number', async () => {
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024).fill('a').join('');
        const file = new File([fileContent], 'multipart-fallback');

        const name = `${prefix}multipart/upload-file.js`;
        try {
          await store.multipartUpload(name, file, {
            partSize: 14.56,
            progress() {
              progress++;
            }
          });
        } catch (e) {
          assert.equal('partSize must be int number', e.message);
        }
      });
    });
  });

  describe('request time is skew', () => {
    it('When the client\'s date is skew, the request will calibration time and retry', async () => {
      const store = oss(ossConfig);
      const name = `${prefix}put/skew_date`;
      const body = Buffer.from('body');
      const requestSpy = sinon.spy(store, 'request');
      const requestErrorSpy = sinon.spy(store, 'requestError');

      timemachine.config({
        dateString: 'December 25, 1991 13:12:59',
        tick: true
      });
      const resultPut = await store.put(name, body);
      assert.equal(resultPut.res.status, 200);

      assert.equal(requestSpy.callCount, 2);
      assert.equal(requestErrorSpy.callCount, 1);

      const resultGet = await store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), body.toString());

      const resultDel = await store.delete(name);
      assert.equal(resultDel.res.status, 204);

      timemachine.reset();
    });


    it('date is skew, put file will retry', async () => {
      const store = oss(ossConfig);
      const name = `${prefix}put/skew_date_file`;
      const requestSpy = sinon.spy(store, 'request');
      const requestErrorSpy = sinon.spy(store, 'requestError');
      const fileContent = Array(1024 * 1024).fill('a').join('');
      const file = new File([fileContent], 'skew_date_file');

      timemachine.config({
        dateString: 'December 25, 1991 13:12:59',
        tick: true
      });
      const resultPut = await store.put(name, file);
      assert.equal(resultPut.res.status, 200);

      assert.equal(requestSpy.callCount, 2);
      assert.equal(requestErrorSpy.callCount, 1);

      const resultGet = await store.get(name);
      assert.equal(resultGet.res.status, 200);

      assert.equal(resultGet.content.toString(), fileContent);

      const resultDel = await store.delete(name);
      assert.equal(resultDel.res.status, 204);

      timemachine.reset();
    });
  });

  describe('requestErr()', () => {
    let store;
    before(() => {
      const ossConfigz = {
        region: stsConfig.region,
        accessKeyId: stsConfig.Credentials.AccessKeyId,
        accessKeySecret: stsConfig.Credentials.AccessKeySecret,
        stsToken: stsConfig.Credentials.SecurityToken,
        bucket: stsConfig.bucket,
        timeout: 1
      };
      store = oss(ossConfigz);
    });
    it('should request timeout exception', async () => {
      const fileContent = Array(1024 * 1024).fill('a').join('');
      const file = new File([fileContent], 'multipart-upload-file');

      const name = `${prefix}multipart/upload-file-timeout`;

      let timeoutErr;
      try {
        await store.multipartUpload(name, file);
      } catch (err) {
        timeoutErr = err;
      }
      assert.equal(true, timeoutErr && Object.keys(timeoutErr).length !== 0);
      assert.equal(timeoutErr.status, -2);
    });

    it('should request net exception', async () => {
      const fileContent = Array(1024 * 1024).fill('a').join('');
      const file = new File([fileContent], 'multipart-upload-file');

      const name = `${prefix}multipart/upload-file-timeout`;
      const stubNetError = sinon.stub(store.urllib, 'request');
      const netErr = new Error('TestNetErrorException');
      netErr.status = -1;
      netErr.code = 'RequestError';
      netErr.name = 'RequestError';
      stubNetError.throws(netErr);
      let netErrz;
      try {
        await store.multipartUpload(name, file);
      } catch (err) {
        netErrz = err;
      }
      assert.equal(true, netErrz && Object.keys(netErrz).length !== 0);
      assert.equal(netErrz.status, -1);

      store.urllib.request.restore();
    });
  });
});
