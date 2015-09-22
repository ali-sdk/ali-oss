/**!
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

var assert = require('assert');
var oss = require('../');

describe('test/client.test.js', function () {
  it('should init with cname: foo.bar.com', function () {
    var store = oss({
      accessKeyId: 'foo',
      accessKeySecret: 'bar',
      cname: 'foo.bar.com',
    });

    assert.equal(store.options.cname, 'http://foo.bar.com');
  });

  it('should init with cname: http://foo.bar.com', function () {
    var store = oss({
      accessKeyId: 'foo',
      accessKeySecret: 'bar',
      cname: 'http://foo.bar.com',
    });

    assert.equal(store.options.cname, 'http://foo.bar.com');
  });

  it('should init with cname: https://foo.bar.com', function () {
    var store = oss({
      accessKeyId: 'foo',
      accessKeySecret: 'bar',
      cname: 'https://foo.bar.com',
    });

    assert.equal(store.options.cname, 'https://foo.bar.com');
  });
});
