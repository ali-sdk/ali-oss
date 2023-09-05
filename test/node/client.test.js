const assert = require('assert');
const oss = require('../..');
const config = require('../config').oss;
const mm = require('mm');
const pkg = require('../../package.json');

describe('test/client.test.js', () => {
  it('init stsTokenFreshTime', () => {
    const store = oss(config);
    const now = new Date();
    if (!store.stsTokenFreshTime) {
      throw new Error('not init stsTokenFreshTime');
    }
    assert(true, +now <= +store.stsTokenFreshTime);
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
      endpoint: 'http://test.oss.com'
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

  it('should set User-Agent', async () => {
    after(mm.restore);

    const store = oss(config);
    let header;
    const req = store.urllib.request;
    mm(store.urllib, 'request', (url, args) => {
      header = args.headers;
      return req(url, args);
    });

    const result = await store.listBuckets();
    assert.equal(result.res.status, 200);
    assert(header['User-Agent']);
    assert(header['User-Agent'].startsWith(`aliyun-sdk-nodejs/${pkg.version} Node.js ${process.version.slice(1)}`));
    // node 环境移除了x-oss-user-agent
    // assert(header['x-oss-user-agent']);
    // assert(header['x-oss-user-agent'].startsWith(`aliyun-sdk-nodejs/${pkg.version} Node.js ${process.version.slice(1)}`));
  });

  it('should check beta or alpha User-Agent', () => {
    const store = oss(config);
    const uaBeta = store._checkUserAgent('aliyun-sdk-nodejs/4.12.2 Node.js β-8.4.0 on darwin x64');
    assert.equal(uaBeta, 'aliyun-sdk-nodejs/4.12.2 Node.js beta-8.4.0 on darwin x64');
    const uaAlpha = store._checkUserAgent('aliyun-sdk-nodejs/4.12.2 Node.js α-8.4.0 on darwin x64');
    assert.equal(uaAlpha, 'aliyun-sdk-nodejs/4.12.2 Node.js alpha-8.4.0 on darwin x64');
  });

  it('should check browser and version', () => {
    const store = oss(config);
    assert(store.checkBrowserAndVersion('', ''));
    assert(!store.checkBrowserAndVersion('non-nodejs', ''));
    assert(!store.checkBrowserAndVersion('', 'error-version'));
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

  describe('checkConfigValid', () => {
    it('should success when endpoint is invalid', () => {
      const checkConfig = {
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true
      };
      try {
        oss(checkConfig);
      } catch (error) {
        assert(false);
      }
    });
    it('should throw when endpoint includes invalid character', () => {
      const checkConfig = {
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'vpc100-oss-cn-hang<tag />zhou',
        internal: true,
        secure: true
      };
      try {
        oss(checkConfig);
        assert(false);
      } catch (error) {
        assert(error.message.includes('endpoint'));
      }
    });
    it('should throw when endpoint change to invalid character', async () => {
      const checkConfig = {
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        endpoint: 'vpc100-oss-cn-hangzhou',
        internal: true,
        secure: true
      };
      try {
        const store = oss(checkConfig);
        const invalidHost = 'vpc100-oss-cn-hangzhou.《》.com';
        store.options.endpoint.host = invalidHost;
        store.options.endpoint.hostname = invalidHost;
        await store.listBuckets();
        assert(false);
      } catch (error) {
        assert(error.message.includes('endpoint'));
      }
    });
    it('should success when region is valid', () => {
      const checkConfig = {
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-hangzhou',
        internal: true,
        secure: true
      };
      try {
        oss(checkConfig);
      } catch (error) {
        assert(false);
      }
    });
    it('should throw when region includes invalid character', () => {
      const checkConfig = {
        accessKeyId: 'foo',
        accessKeySecret: 'bar',
        region: 'oss-cn-?hangzhou',
        internal: true,
        secure: true
      };
      try {
        oss(checkConfig);
        assert(false);
      } catch (error) {
        assert(error.message.includes('region'));
      }
    });
  });
});
