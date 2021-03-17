/* eslint-disable @typescript-eslint/no-unused-vars */

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
const { Readable } = require('stream');
const { prefix } = require('./browser-utils');

let ossConfig;
const timemachine = require('timemachine');

timemachine.reset();

const cleanBucket = async store => {
  let result = await store.list({
    'max-keys': 1000
  });
  result.objects = result.objects || [];
  await Promise.all(result.objects.map(_ => store.delete(_.name)));

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  await Promise.all(uploads.map(_ => store.abortMultipartUpload(_.name, _.uploadId)));
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

      assert.equal(store.options.endpoint.format(), 'http://oss-cn-hangzhou.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true
      });

      assert.equal(store.options.endpoint.format(), 'http://oss-cn-hangzhou-internal.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(store.options.endpoint.format(), 'https://oss-cn-hangzhou-internal.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-beijing'
      });

      assert.equal(store.options.endpoint.format(), 'http://vpc100-oss-cn-beijing.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-shenzhen',
        internal: true
      });

      assert.equal(store.options.endpoint.format(), 'http://vpc100-oss-cn-shenzhen.aliyuncs.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true
      });

      assert.equal(store.options.endpoint.format(), 'https://vpc100-oss-cn-hangzhou.aliyuncs.com/');
    });

    it('should init with cname: foo.bar.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'foo.bar.com',
        cname: true
      });

      assert.equal(store.options.endpoint.format(), 'http://foo.bar.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://foo.bar.com',
        cname: true
      });

      assert.equal(store.options.endpoint.format(), 'http://foo.bar.com/');
    });

    it('should init with endpoint: http://test.oss.com', () => {
      let store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'test.oss.com'
      });

      assert.equal(store.options.endpoint.format(), 'http://test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        secure: true,
        endpoint: 'test.oss.com'
      });

      assert.equal(store.options.endpoint.format(), 'https://test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'http://test.oss.com'
      });

      assert.equal(store.options.endpoint.format(), 'http://test.oss.com/');

      store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'https://test.oss.com'
      });

      assert.equal(store.options.endpoint.format(), 'https://test.oss.com/');
    });

    it('should init with ip address: http://127.0.0.1', () => {
      const store = oss({
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: '127.0.0.1'
      });

      assert.equal(store.options.endpoint.format(), 'http://127.0.0.1/');
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
      assert.equal(url, 'http://127.0.0.1:6000/');
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
      assert.equal(url, 'http://127.0.0.1:3000/hello');
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

  describe('listV2()', () => {
    let listPrefix;
    let store;
    before(async () => {
      listPrefix = `${prefix}ali-sdk/listV2/`;
      store = oss(ossConfig);
      await store.put(`${listPrefix}oss.jpg`, Buffer.from('oss.jpg'));
      await store.put(`${listPrefix}fun/test.jpg`, Buffer.from('fun/test.jpg'));
      await store.put(`${listPrefix}fun/movie/001.avi`, Buffer.from('fun/movie/001.avi'));
      await store.put(`${listPrefix}fun/movie/007.avi`, Buffer.from('fun/movie/007.avi'));
      await store.put(`${listPrefix}other/movie/007.avi`, Buffer.from('other/movie/007.avi'));
      await store.put(`${listPrefix}other/movie/008.avi`, Buffer.from('other/movie/008.avi'));
    });

    function checkObjectProperties(obj, options) {
      assert.equal(typeof obj.name, 'string');
      assert.equal(typeof obj.lastModified, 'string');
      assert.equal(typeof obj.etag, 'string');
      assert(obj.type === 'Normal' || obj.type === 'Multipart');
      assert.equal(typeof obj.size, 'number');
      assert.equal(obj.storageClass, 'Standard');
      if (options.owner) {
        assert(typeof obj.owner.id === 'string' && typeof obj.owner.displayName === 'string');
      } else {
        assert(obj.owner === null);
      }
    }

    it('should list top 3 objects', async () => {
      const result = await store.listV2({
        'max-keys': 1
      });
      assert.equal(result.objects.length, 1);
      result.objects.forEach(checkObjectProperties);
      assert.equal(typeof result.nextContinuationToken, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);

      // next 2
      const result2 = await store.listV2({
        'max-keys': 2,
        continuationTOken: result.nextContinuationToken
      });
      assert.equal(result2.objects.length, 2);
      result.objects.forEach(checkObjectProperties);
      assert.equal(typeof result2.nextContinuationToken, 'string');
      assert(result2.isTruncated);
      assert.equal(result2.prefixes, null);
    });

    it('should list with prefix', async () => {
      let result = await store.listV2({
        prefix: `${listPrefix}fun/movie/`,
        'fetch-owner': true
      });
      assert.equal(result.objects.length, 2);
      result.objects.forEach(obj => checkObjectProperties(obj, { owner: true }));
      assert.equal(result.nextContinuationToken, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);

      result = await store.listV2({
        prefix: `${listPrefix}fun/movie`
      });
      assert.equal(result.objects.length, 2);
      result.objects.forEach(checkObjectProperties);
      assert.equal(result.nextContinuationToken, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list current dir files only', async () => {
      let result = await store.listV2({
        prefix: listPrefix,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.forEach(checkObjectProperties);
      assert.equal(result.nextContinuationToken, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/`, `${listPrefix}other/`]);

      result = await store.listV2({
        prefix: `${listPrefix}fun/`,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.forEach(checkObjectProperties);
      assert.equal(result.nextContinuationToken, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/movie/`]);

      result = await store.listV2({
        prefix: `${listPrefix}fun/movie/`,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 2);
      result.objects.forEach(checkObjectProperties);
      assert.equal(result.nextContinuationToken, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list with start-afer', async () => {
      let result = await store.listV2({
        'start-after': `${listPrefix}fun`,
        'max-keys': 1
      });
      assert(result.objects[0].name === `${listPrefix}fun/movie/001.avi`);

      result = await store.listV2({
        'start-after': `${listPrefix}fun/movie/001.avi`,
        'max-keys': 1
      });
      assert(result.objects[0].name === `${listPrefix}fun/movie/007.avi`);

      result = await store.listV2({
        delimiter: '/',
        prefix: `${listPrefix}fun/movie/`,
        'start-after': `${listPrefix}fun/movie/002.avi`
      });
      assert(result.objects.length === 1);
      assert(result.objects[0].name === `${listPrefix}fun/movie/007.avi`);

      result = await store.listV2({
        prefix: `${listPrefix}`,
        'max-keys': 5,
        'start-after': `${listPrefix}a`,
        delimiter: '/'
      });
      assert.strictEqual(result.keyCount, 3);
      assert.strictEqual(result.objects.length, 1);
      assert.strictEqual(result.objects[0].name, `${listPrefix}oss.jpg`);
      assert.strictEqual(result.prefixes.length, 2);
      assert.strictEqual(result.prefixes[0], `${listPrefix}fun/`);
      assert.strictEqual(result.prefixes[1], `${listPrefix}other/`);

      result = await store.listV2({
        prefix: `${listPrefix}`,
        'max-keys': 5,
        'start-after': `${listPrefix}oss.jpg`,
        delimiter: '/'
      });
      assert.strictEqual(result.keyCount, 1);
      assert.strictEqual(result.objects, undefined);
      assert.strictEqual(result.prefixes[0], `${listPrefix}other/`);
    });

    it('should list with continuation-token', async () => {
      let nextContinuationToken = null;
      let keyCount = 0;
      do {
        // eslint-disable-next-line no-await-in-loop
        const result = await store.listV2({
          prefix: listPrefix,
          'max-keys': 2,
          'continuation-token': nextContinuationToken
        });
        keyCount += result.keyCount;
        nextContinuationToken = result.nextContinuationToken;
      } while (nextContinuationToken);
      assert.strictEqual(keyCount, 6);
    });
  });

  describe('get()', () => {
    const name = `${prefix}ali-sdk/get/${Date.now()}-oss.jpg`;
    let store;
    before(async () => {
      store = new OSS(ossConfig);
      await store.put(name, Buffer.from('oss.jpg'));
    });
    it('should get with default responseCacheControl option', async () => {
      const {
        res: { requestUrls }
      } = await store.get(name);
      assert(requestUrls[0].includes('response-cache-control=no-cache'));
      const {
        res: { requestUrls: requestUrls2 }
      } = await store.get(name, {
        responseCacheControl: null
      });
      assert(!requestUrls2[0].includes('response-cache-control=no-cache'));
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
      const name = `${prefix}put/test1`;
      const body = new Blob(['blobBody'], { type: 'text/plain' });
      const resultPut = await store.put(name, body);
      assert.equal(resultPut.res.status, 200);
      const resultGet = await store.get(name);
      assert.equal(resultGet.res.status, 200);

      await new Promise(resolve => {
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

    it('should throw ConnectionTimeoutError when putstream timeout', async () => {
      const name = `${prefix}put/test`;
      const content = Array(1024 * 1024 * 10)
        .fill(1)
        .join('');
      const body = new Blob([content], { type: 'text/plain' });
      const options = {
        timeout: 300
      };
      try {
        setTimeout(() => {
          options.timeout = 60000;
        }, 200);
        await store.put(name, body, options);
        assert(false);
      } catch (error) {
        assert(error.name === 'ConnectionTimeoutError');
      }
    });

    it('should set custom Content-MD5 and ignore case', async () => {
      const name = `${prefix}put/test-md5`;
      const content = Array(1024 * 1024 * 2)
        .fill(1)
        .join('');
      const body = new Blob([content], { type: 'text/plain' });
      const MD5Value = crypto1
        .createHash('md5')
        .update(OSS.Buffer(await body.arrayBuffer()))
        .digest('base64');
      await store.put(name, body, {
        headers: {
          'Content-MD5': MD5Value
        }
      });
      await store.put(name, body, {
        headers: {
          'content-Md5': MD5Value
        }
      });
    });
  });

  describe('test-content-type', () => {
    let store;
    before(async () => {
      store = oss(ossConfig);
    });

    it('should put object and content-type not null when upload file and object name has no MIME', async () => {
      const name = `${prefix}put/test-content-type`;
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
      const file = new File([fileContent], 'test-content-type');
      const object = await store.put(name, file);
      assert(object.name, name);

      const r = await store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.res.headers['content-type'], 'application/octet-stream');
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
      // It should be 'no-cache' in the real browser environment, but other environments are undefined
      assert(!info.res.headers['cache-control'] || info.res.headers['cache-control'] === 'no-cache');

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

    it('should copy object with special characters such as ;,/?:@&=+$#', async () => {
      const sourceName = `${prefix}ali-sdk/oss/copy-a;,/?:@&=+$#b.js`;
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
      const file = new File([fileContent], sourceName);
      await store.put(sourceName, file);
      await store.copy(`${prefix}ali-sdk/oss/copy-a.js`, sourceName);
      await store.copy(`${prefix}ali-sdk/oss/copy-a+b.js`, sourceName);
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
      const contentMd5 = crypto1.createHash('md5').update(Buffer.from(putString, 'utf8')).digest('base64');
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
      const signatureStore = oss(
        Object.assign({}, ossConfig, {
          endpoint: 'www.aliyun.com',
          cname: true
        })
      );

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
        await Promise.all(uploads.map(_ => store.abortMultipartUpload(_.name, _.uploadId)));
      });

      it('should list by key marker', async () => {
        const name = `${prefix}multipart/list-key`;

        const ids = (
          await Promise.all(
            Array(5)
              .fill(1)
              .map((v, i) => store.initMultipartUpload(name + i))
          )
        ).map(_ => _.uploadId);

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
        const ids = (
          await Promise.all(
            Array(5)
              .fill(1)
              // eslint-disable-next-line no-unused-vars
              .map(_ => store.initMultipartUpload(name))
          )
        )
          .map(_ => _.uploadId)
          .sort();

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
        const fooIds = (
          await Promise.all(
            Array(5)
              .fill(1)
              // eslint-disable-next-line no-unused-vars
              .map(_ => store.initMultipartUpload(fooName))
          )
        )
          .map(_ => _.uploadId)
          .sort();

        const barName = `${prefix}multipart/list-bar`;
        const barIds = (
          await Promise.all(
            Array(5)
              .fill(5)
              // eslint-disable-next-line no-unused-vars
              .map(_ => store.initMultipartUpload(barName))
          )
        )
          .map(_ => _.uploadId)
          .sort();

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
        const fileContent = Array(1034 * 1024)
          .fill('a')
          .join('');
        const fileName = new File([fileContent], 'multipart-upload-kms');
        const result = await store.multipartUpload(name, fileName, {
          headers: {
            'x-oss-server-side-encryption': 'KMS'
          }
        });
        assert.equal(result.res.headers['x-oss-server-side-encryption'], 'KMS');
      });

      it('should fallback to put when file size is smaller than 100KB', async () => {
        const file = new File(['multipart-fallback-test'], 'multipart-fallback');
        const name = `${prefix}multipart/fallback`;
        let progress = 0;
        const putSpy = sinon.spy(store, 'put');
        const uploadPartSpy = sinon.spy(store, '_uploadPart');
        const result = await store.multipartUpload(name, file, {
          progress() {
            progress++;
          }
        });
        assert.equal(putSpy.callCount, 1);
        assert.equal(uploadPartSpy.callCount, 0);
        assert.equal(typeof result.name, 'string');
        assert.equal(typeof result.bucket, 'string');
        assert.equal(typeof result.etag, 'string');

        assert.equal(progress, 1);
        store.put.restore();
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
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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

      it('should upload buffer', async () => {
        // create a buffer with 1M random data
        const bufferString = Array(1024 * 1024)
          .fill('a')
          .join('');
        const fileBuf = Buffer.from(bufferString);

        const name = `${prefix}multipart/upload-buffer`;

        let progress = 0;
        const result = await store.multipartUpload(name, fileBuf, {
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

        assert.equal(object.content.length, fileBuf.length);
        // avoid comparing buffers directly for it may hang when generating diffs
        assert.deepEqual(md5(object.content), md5(fileBuf));
      });

      it('should return requestId in init, upload part, complete', async () => {
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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
            progress() {},
            partSize: 100 * 1024
          });
        } catch (err) {
          errorMsg = err.message;
          partNumz = err.partNum;
          errStatus = err.status;
        }
        store._uploadPart.restore();
        assert.equal(errorMsg, 'Failed to upload some parts with error: TestUploadPartException part_num: 1');
        assert.equal(partNumz, 1);
        assert.equal(errStatus, 403);
      });

      // multipart cancel test
      it('should upload file with cancel', async () => {
        const client = oss(ossConfig);
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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

      it('should multipart upload file with checkpoint', async () => {
        const client = store;
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
        const file = new File([fileContent], 'multipart-upload-file');

        const name = `${prefix}multipart/upload-file-checkpoint`;
        let checkpoint;
        const options = {
          async progress(p, _checkpoint) {
            if (p > 0.5 && !checkpoint) {
              client.resetCancelFlag();
              checkpoint = _checkpoint;
            }
          },
          partSize: 100 * 1024,
          checkpoint
        };
        try {
          await client.multipartUpload(name, file, options);
        } catch (err) {
          assert.equal(true, client.isCancel());
        }
        await client.multipartUpload(name, file, options);
        const result = await client.get(name);
        assert.equal(result.content.length, 1024 * 1024);
      });

      it('should upload with uploadPart', async () => {
        const fileContent = Array(10 * 100 * 1024)
          .fill('a')
          .join('');
        const file = new File([fileContent], 'multipart-upload-part');

        const name = `${prefix}multipart/upload-part-file.js`;
        const init = await store.initMultipartUpload(name);
        const { uploadId } = init;
        const partSize = 100 * 1024;

        const parts = await Promise.all(
          Array(10)
            .fill(1)
            .map((v, i) =>
              store.uploadPart(name, uploadId, i + 1, file, i * partSize, Math.min((i + 1) * partSize, 10 * 100 * 1024))
            )
        );
        const dones = parts.map((_, i) => ({
          number: i + 1,
          etag: _.etag
        }));

        const result = await store.completeMultipartUpload(name, uploadId, dones);
        assert.equal(result.res.status, 200);
      });

      it('should upload with list part', async () => {
        const client = store;
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
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
        } catch (err) {}

        const result = await store.listParts(
          name,
          uploadIdz,
          {
            'max-parts': 1000
          },
          {}
        );

        assert.equal(result.res.status, 200);
      });

      it('multipartUploadStreams.length', async () => {
        const stubNetError = sinon.stub(store, '_uploadPart');
        const netErr = new Error('TestNetErrorException');
        netErr.status = -1;
        netErr.code = 'RequestError';
        netErr.name = 'RequestError';
        stubNetError.throws(netErr);
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
        const filename = `multipart-upload-file-${Date.now()}`;
        const file = new File([fileContent], filename);
        const name = `${prefix}multipart/upload-file-${Date.now()}`;
        const name1 = `${prefix}multipart/upload-file-1-${Date.now()}`;
        try {
          await Promise.all([store.multipartUpload(name, file), store.multipartUpload(name1, file)]);
        } catch (e) {}
        store._uploadPart.restore();
        await Promise.all([store.multipartUpload(name, file), store.multipartUpload(name1, file)]);
        assert.strictEqual(store.multipartUploadStreams.length, 0);
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

      it('should upload partSize be int number and greater then minPartSize', async () => {
        // create a file with 1M random data
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
        const filename = `multipart-upload-file-${Date.now()}`;
        const file = new File([fileContent], filename);
        const name = `${prefix}multipart/upload-file`;
        let progress = 0;
        try {
          const result = await store.multipartUpload(name, file, {
            partSize: 14.56,
            progress() {
              progress++;
            }
          });
        } catch (e) {
          assert.equal('partSize must be int number', e.message);
        }

        try {
          await store.multipartUpload(name, file, {
            partSize: 1,
            progress() {
              progress++;
            }
          });
        } catch (e) {
          assert.ok(e.message.startsWith('partSize must not be smaller'));
        }
      });

      it('should skip doneParts when re-upload mutilpart files', async () => {
        const PART_SIZE = 1024 * 100;
        const FILE_SIZE = 1024 * 500;
        const SUSPENSION_LIMIT = 3;
        const object = `multipart-${Date.now()}`;
        const fileContent = Array(FILE_SIZE).fill('a').join('');
        const file = new File([fileContent], object);
        const uploadPart = store._uploadPart;
        let checkpoint;
        store._uploadPart = function (name, uploadId, partNo, data) {
          if (partNo === SUSPENSION_LIMIT) {
            throw new Error('mock upload part fail.');
          } else {
            return uploadPart.call(this, name, uploadId, partNo, data);
          }
        };
        try {
          await store.multipartUpload(object, file, {
            parallel: 1,
            partSize: PART_SIZE,
            progress: (percentage, c) => {
              checkpoint = c;
            }
          });
        } catch (e) {
          assert.strictEqual(checkpoint.doneParts.length, SUSPENSION_LIMIT - 1);
        }
        store._uploadPart = uploadPart;
        const uploadPartSpy = sinon.spy(store, '_uploadPart');
        await store.multipartUpload(object, file, {
          parallel: 1,
          partSize: PART_SIZE,
          checkpoint
        });
        assert.strictEqual(uploadPartSpy.callCount, FILE_SIZE / PART_SIZE - SUSPENSION_LIMIT + 1);
        store._uploadPart.restore();
      });

      it('should request throw abort event', async () => {
        const fileContent = Array(1024 * 1024)
          .fill('a')
          .join('');
        const file = new File([fileContent], 'multipart-upload-file');
        const name = `${prefix}multipart/upload-file`;
        const uploadPart = store._uploadPart;
        store._uploadPart = () => {
          const e = new Error('TEST Not Found');
          e.status = 404;
          throw e;
        };
        let netErrs;
        try {
          await store.multipartUpload(name, file);
        } catch (err) {
          netErrs = err;
        }
        console.log(netErrs);
        assert.strictEqual(netErrs.status, 0);
        assert.strictEqual(netErrs.name, 'abort');
        store._uploadPart = uploadPart;
      });
    });
  });

  describe('symlink()', () => {
    it('Should put and get Symlink', async () => {
      const store = oss(ossConfig);
      const targetName = '/oss/target-测试.js';
      const name = '/oss/symlink-软链接.js';
      let result = await store.put(targetName, Buffer.from('test-symlink'));
      assert.equal(result.res.status, 200);

      result = await store.putSymlink(name, targetName, {
        storageClass: 'IA',
        meta: {
          uid: '1',
          slus: 'test.html'
        }
      });
      assert.equal(result.res.status, 200);

      result = await store.getSymlink(name);
      assert.equal(result.res.status, 200);
      // 需要设置暴露headers x-oss-symlink-target
      // assert.equal(result.targetName, store._objectName(targetName));

      result = await store.head(name);

      assert.equal(result.res.status, 200);
      // 需要设置暴露headers x-oss-object-type
      assert.equal(result.res.headers['x-oss-object-type'], 'Symlink');
      // 需要设置对应暴露的headers  每个对应meta的header
      // assert.deepEqual(result.meta, {
      //   uid: '1',
      //   slus: 'test.html'
      // });
      // TODO getObjectMeta should return storage class,
      // headObject return targetObject storage class
      // result = await store.getObjectMeta(name);
      // console.log(result);
    });
  });

  describe('deleteMulti()', () => {
    const names = [];
    beforeEach(async () => {
      const store = oss(ossConfig);
      let name = `${prefix}ali-sdk/oss/deleteMulti0.js`;
      names.push(name);
      await store.put(name, Buffer.from(name));

      name = `${prefix}ali-sdk/oss/deleteMulti1.js`;
      names.push(name);
      await store.put(name, Buffer.from(name));

      name = `${prefix}ali-sdk/oss/deleteMulti2.js`;
      names.push(name);
      await store.put(name, Buffer.from(name));
    });

    it('should delete 3 exists objs', async () => {
      const store = oss(ossConfig);
      const result = await store.deleteMulti(names);
      assert.deepEqual(
        result.deleted.map(v => v.Key),
        names
      );
      assert.equal(result.res.status, 200);
    });

    it('should delete 2 exists and 2 not exists objs', async () => {
      const store = oss(ossConfig);
      const result = await store.deleteMulti(names.slice(0, 2).concat(['not-exist1', 'not-exist2']));
      assert.deepEqual(
        result.deleted.map(v => v.Key),
        names.slice(0, 2).concat(['not-exist1', 'not-exist2'])
      );
      assert.equal(result.res.status, 200);
    });

    it('should delete 1 exists objs', async () => {
      const store = oss(ossConfig);
      const result = await store.deleteMulti(names.slice(0, 1));
      assert.deepEqual(
        result.deleted.map(v => v.Key),
        names.slice(0, 1)
      );
      assert.equal(result.res.status, 200);
    });

    it('should delete in quiet mode', async () => {
      const store = oss(ossConfig);
      const result = await store.deleteMulti(names, {
        quiet: true
      });
      assert(result.deleted.length === 0);
      assert.equal(result.res.status, 200);
    });
  });

  describe('getObjectMeta()', () => {
    let name;
    let resHeaders;
    let fileSize;
    before(async () => {
      const store = oss(ossConfig);
      name = `${prefix}ali-sdk/oss/object-meta.js`;
      const fileContent = Array(10 * 100 * 1024)
        .fill('a')
        .join('');
      const file = new File([fileContent], 'multipart-upload-part');
      const object = await store.put(name, file);
      fileSize = 10 * 100 * 1024;
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      resHeaders = object.res.headers;
    });

    it('should head not exists object throw NoSuchKeyError', async () => {
      const store = oss(ossConfig);
      try {
        await store.head(`${name}not-exists`);
      } catch (error) {
        assert.equal(error.name, 'NoSuchKeyError');
        assert.equal(error.status, 404);
        assert.equal(typeof error.requestId, 'string');
      }
    });

    it('should return Etag and Content-Length', async () => {
      const store = oss(ossConfig);
      const info = await store.getObjectMeta(name);
      assert.equal(info.status, 200);
      assert.equal(info.res.headers.etag, resHeaders.etag);
      assert.equal(info.res.headers['content-length'], fileSize);
    });
  });

  describe('request time is skew', () => {
    it("When the client's date is skew, the request will calibration time and retry", async () => {
      const store = oss(ossConfig);
      const name = `${prefix}put/skew_date`;
      const body = Buffer.from('body');
      const requestSpy = sinon.spy(store.urllib, 'request');
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
      store.urllib.request.restore();
      store.requestError.restore();
      timemachine.reset();
    });

    it('date is skew, put file will retry', async () => {
      const store = oss(ossConfig);
      const name = `${prefix}put/skew_date_file`;
      const requestSpy = sinon.spy(store.urllib, 'request');
      const requestErrorSpy = sinon.spy(store, 'requestError');
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
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
      store.urllib.request.restore();
      store.requestError.restore();
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
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
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
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
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

    it('should request throw ResponseTimeoutError', async () => {
      const fileContent = Array(1024 * 1024)
        .fill('a')
        .join('');
      const fileName = new File([fileContent], 'multipart-upload-file');
      const name = `${prefix}multipart/upload-file`;

      const stubNetError = sinon.stub(store.urllib, 'request');
      const netErr = new Error('ResponseTimeoutError');
      netErr.status = -1;
      netErr.code = 'ResponseTimeoutError';
      netErr.name = 'ResponseTimeoutError';
      stubNetError.throws(netErr);

      let netErrs;
      try {
        await store.multipartUpload(name, fileName);
      } catch (err) {
        netErrs = err;
      }
      assert.strictEqual(netErrs.name, 'ResponseTimeoutError');
      store.urllib.request.restore();
    });
  });

  describe('options.headerEncoding', () => {
    let store;
    const utf8_content = '阿达的大多';
    const latin1_content = Buffer.from(utf8_content).toString('latin1');
    let name;
    before(async () => {
      store = oss(Object.assign({}, ossConfig, { headerEncoding: 'latin1' }));
      name = `${prefix}ali-sdk/oss/put-new-latin1.js`;
      const result = await store.put(name, Buffer.from('123'), {
        meta: {
          a: utf8_content
        }
      });
      assert.equal(result.res.status, 200);
      const info = await store.head(name);
      assert.equal(info.status, 200);
      assert.equal(info.meta.a, latin1_content);
    });

    it('copy() should return 200 when set zh-cn meta', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new-latin1.js`;
      const result = await store.copy(originname, name, {
        meta: {
          a: utf8_content
        }
      });
      assert.equal(result.res.status, 200);
      const info = await store.head(originname);
      assert.equal(info.status, 200);
      assert.equal(info.meta.a, latin1_content);
    });

    it('copy() should return 200 when set zh-cn meta with zh-cn object name', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new-latin1-中文.js`;
      const result = await store.copy(originname, name, {
        meta: {
          a: utf8_content
        }
      });
      assert.equal(result.res.status, 200);
      const info = await store.head(originname);
      assert.equal(info.status, 200);
      assert.equal(info.meta.a, latin1_content);
    });

    it('putMeta() should return 200', async () => {
      const result = await store.putMeta(name, {
        a: utf8_content
      });
      assert.equal(result.res.status, 200);
      const info = await store.head(name);
      assert.equal(info.status, 200);
      assert.equal(info.meta.a, latin1_content);
    });
  });

  describe('test/retry.test.js', () => {
    let store;
    const RETRY_MAX = 3;
    let testRetryCount = 0;

    let ORIGIN_REQUEST;
    const mock = () => {
      store.urllib.request = params => {
        if (params.stream) {
          params.stream.destroy();
        }
        const e = new Error('NetError');
        e.status = -1;
        throw e;
      };
    };
    const restore = () => {
      store.urllib.request = ORIGIN_REQUEST;
    };

    before(async () => {
      const ossConfigz = {
        region: stsConfig.region,
        accessKeyId: stsConfig.Credentials.AccessKeyId,
        accessKeySecret: stsConfig.Credentials.AccessKeySecret,
        stsToken: stsConfig.Credentials.SecurityToken,
        bucket: stsConfig.bucket,
        retryMax: RETRY_MAX,
        requestErrorRetryHandle: () => {
          testRetryCount++;
          if (testRetryCount === RETRY_MAX) {
            restore();
          }
          return true;
        }
      };
      store = oss(ossConfigz);
      ORIGIN_REQUEST = store.urllib.request;
    });
    beforeEach(() => {
      testRetryCount = 0;
      mock();
    });
    afterEach(() => {
      restore();
    });

    it('set retryMax to test request auto retry when networkError or timeout', async () => {
      const res = await store.list();
      assert.strictEqual(res.res.status, 200);
      assert.strictEqual(testRetryCount, RETRY_MAX);
    });

    it('should throw when retry count bigger than options retryMax', async () => {
      try {
        testRetryCount = RETRY_MAX + 1;
        await store.list();
        assert(false, 'should throw error');
      } catch (error) {
        assert(error.status === -1);
      }
    });

    it('should succeed when put with file', async () => {
      const name = `ali-oss-test-retry-file-${Date.now()}`;
      const file = new File([1, 2, 3, 4, 5, 6, 7], name);
      const res = await store.put(name, file);
      assert.strictEqual(res.res.status, 200);
      assert.strictEqual(testRetryCount, RETRY_MAX);
      const onlineFile = await store.get(name);
      assert.strictEqual(onlineFile.content.toString(), '1234567');
    });

    it('should succeed when multipartUpload with file', async () => {
      const originRequest = store.urllib.request;
      const UPLOAD_PART_SEQ = 1;
      let CurrentRequsetTimer = 0;
      store.urllib.request = async (url, params) => {
        // skip mock when initMultipartUpload
        if (CurrentRequsetTimer < UPLOAD_PART_SEQ) {
          CurrentRequsetTimer++;
          return await originRequest(url, params);
        }
        // mock net error when upload part
        if (testRetryCount < RETRY_MAX) {
          if (params.stream) {
            params.stream.destroy();
          }
          const e = new Error('net error');
          e.status = -1;
          e.headers = {};
          throw e;
        } else {
          return await originRequest(url, params);
        }
      };
      const name = `ali-oss-test-retry-file-${Date.now()}`;
      const file = new File(new Array(101 * 1024).fill('1'), name);
      const res = await store.multipartUpload(name, file);
      assert.strictEqual(res.res.status, 200);
      assert.strictEqual(testRetryCount, RETRY_MAX);
      const onlineFile = await store.get(name);
      assert.strictEqual(onlineFile.content.length, 101 * 1024);
      assert.strictEqual(onlineFile.content.toString(), new Array(101 * 1024).fill('1').join(''));
      store.urllib.request = originRequest;
    });

    it('should fail when put with stream', async () => {
      const name = `ali-oss-test-retry-file-${Date.now()}`;
      const stream = new Readable({
        read() {
          this.push([1, 2]);
          this.push(null);
        }
      });
      try {
        await store.putStream(name, stream);
        assert(false, 'should not reach here');
      } catch (e) {
        assert.strictEqual(e.status, -1);
      }
    });
  });
});
