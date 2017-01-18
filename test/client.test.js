'use strict';

var assert = require('assert');
var oss = require('../');
var config = require('./config').oss;
var mm = require('mm');
var pkg = require('../package.json');

describe('test/client.test.js', function () {
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

  it('should create request url with bucket', function() {
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

  it('should create request url with bucket/object/subres', function() {
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

  it('should set User-Agent', function* () {
    after(mm.restore);

    var store = oss(config);
    var headers;
    var req = store.urllib.request;
    mm(store.urllib, 'request', function (url, args) {
      headers = args.headers;
      return req(url, args);
    });

    var result = yield store.listBuckets();
    assert.equal(result.res.status, 200);
    assert(headers['User-Agent']);
    assert(headers['User-Agent'].startsWith(
      'aliyun-sdk-nodejs/' + pkg.version + ' Node.js ' + process.version.slice(1)));
    assert(headers['x-oss-user-agent']);
    assert(headers['x-oss-user-agent'].startsWith(
      'aliyun-sdk-nodejs/' + pkg.version + ' Node.js ' + process.version.slice(1)));
  });

  it('should check browser and version', function* () {
    var store = oss(config);
    assert(store.checkBrowserAndVersion("", ""));
    assert(!store.checkBrowserAndVersion("non-nodejs", ""));
    assert(!store.checkBrowserAndVersion("", "error-version"));
  });

  it('should trim access id/key', function* () {
    var store = oss({
      accessKeyId: '  \tfoo\t\n  ',
      accessKeySecret: '  \tbar\n\r   ',
      region: 'oss-cn-hangzhou',
    });

    assert.equal(store.options.accessKeyId, 'foo');
    assert.equal(store.options.accessKeySecret, 'bar');
  });
});
