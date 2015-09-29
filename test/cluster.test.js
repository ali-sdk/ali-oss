/*!
 * Copyright(c) ali-sdk and other contributors.
 *
 * Authors:
 * 	 dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

const cluster = require('../').ClusterClient;
const config = require('./config');
const utils = require('./utils');
const assert = require('assert');
const mm = require('mm');

describe('test/cluster.test.js', function () {
  var prefix = utils.prefix;
  afterEach(mm.restore);

  before(function* () {
    let options = {
      cluster: [config, config]
    };
    this.store = cluster(options);
    this.store.on('error', function () {});
    this.bucket1 = 'ali-oss-test-cluster1-' + prefix.replace(/[\/\.]/g, '');
    this.bucket2 = 'ali-oss-test-cluster2-' + prefix.replace(/[\/\.]/g, '');
    this.region = 'oss-cn-hangzhou';
    yield this.store.clients[0].putBucket(this.bucket1, this.region);
    yield this.store.clients[1].putBucket(this.bucket2, this.region);
    this.store.clients[0].useBucket(this.bucket1, this.region);
    this.store.clients[1].useBucket(this.bucket2, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store.clients[0], this.bucket1, this.region);
    yield utils.cleanBucket(this.store.clients[1], this.bucket2, this.region);
  });

  describe('init', function () {
    it('require options.cluster to be an array', function () {
      (function () {
        cluster({});
      }).should.throw('require options.cluster to be an array');
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

    it('should error when any one is error', function * () {
      mm.error(this.store.clients[1], 'put', 'mock error');
      var name = prefix + 'ali-sdk/oss/put-localfile.js';
      try {
        yield this.store.put(name, __filename);
        throw new Error('should never exec');
      } catch (err) {
        err.message.should.equal('mock error');
      }
    });

    it('should ignore when any one is error', function * () {
      mm.error(this.store.clients[1], 'put', 'mock error');
      var name = prefix + 'ali-sdk/oss/put-localfile.js';
      try {
        yield this.store.put(name, __filename);
        throw new Error('should never exec');
      } catch (err) {
        err.message.should.equal('mock error');
      }
    });
  });

  describe('get()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/get-meta.js';
      let object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should RR get from clients ok', function* () {
      mm(this.store.clients[1], 'get', function*() {
        throw new Error('mock error');
      });
      function onerror(err) {
        throw err;
      }
      this.store.on('error', onerror);

      let res = yield this.store.get(this.name);
      res.res.status.should.equal(200);
      mm.restore();
      mm(this.store.clients[0], 'get', function*() {
        throw new Error('mock error');
      });
      res = yield this.store.get(this.name);
      res.res.status.should.equal(200);

      this.store.removeListener('error', onerror);
    });

    it('should RR get from clients[1] when clients[0] error ok', function* () {
      mm.error(this.store.clients[0], 'get', 'mock error');
      let res = yield this.store.get(this.name);
      this.store.once('error', function (err) {
        err.message.should.equal('mock error');
      });
      res.res.status.should.equal(200);
    });

    it('should MS always get from clients[0] ok', function* () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store.clients[1], 'get', 'mock error');
      function onerror() {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = yield this.store.get(this.name);
      res.res.status.should.equal(200);
      res = yield this.store.get(this.name);
      res.res.status.should.equal(200);

      this.store.removeListener('error', onerror);
    });

    it('should get from clients[0] when clients[0] response 4xx ok', function* () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'get', 'mock error', {status: 403});
      try {
        yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.status.should.equal(403);
      }
    });

    it('should RR error when clients all down', function* () {
      mm.error(this.store.clients[0], 'get', 'mock error');
      mm.error(this.store.clients[1], 'get', 'mock error');
      let store = this.store;
      store.once('error', function (err) {
        err.message.should.equal('mock error');
        store.once('error', function (err) {
          err.message.should.equal('mock error');
        });
      });
      try {
        yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('AllServerDownError');
      }
    });

    it('should MS error when clients all down', function* () {
      mm.error(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'get', 'mock error');
      mm.error(this.store.clients[1], 'get', 'mock error');
      let store = this.store;
      store.once('error', function (err) {
        err.message.should.equal('mock error');
        store.once('error', function (err) {
          err.message.should.equal('mock error');
        });
      });
      try {
        yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('AllServerDownError');
      }
    });
  });

  describe('signatureUrl()', function () {
    before(function* () {
      this.name = prefix + 'ali-sdk/oss/get-meta.js';
      let object = yield this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should RR signatureUrl from clients ok', function* () {
      mm(this.store.clients[1], 'head', 'mock error');
      function onerror() {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
      mm.restore();
      mm(this.store.clients[0], 'head', 'mock error');
      res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
      this.store.removeListener('error', onerror);
    });

    it('should RR signature from clients[1] when clients[0] error ok', function* () {
      mm.error(this.store.clients[0], 'head', 'mock error');
      let res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
      this.store.once('error', function (err) {
        err.message.should.equal('mock error');
      });
    });

    it('should MS always signature from clients[0] ok', function* () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store.clients[1], 'head', 'mock error');
      function onerror() {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
      res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);

      this.store.removeListener('error', onerror);
    });

    it('should signature from clients[0] when clients[0] response 4xx ok', function* () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'head', 'mock error', {status: 403});
      let res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should signature ok when clients all down', function* () {
      mm.error(this.store.clients[0], 'head', 'mock error');
      mm.error(this.store.clients[1], 'head', 'mock error');
      let store = this.store;
      store.once('error', function (err) {
        err.message.should.equal('mock error');
      });
      let res = yield this.store.signatureUrl(this.name);
      res.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });
  });
});
