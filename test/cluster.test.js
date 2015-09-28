/*!
 * ali-oss - test/cluster.test.js
 * Copyright(c) @dead_horse
 * Author: dead_horse <dead_horse@qq.com>
 */

'use strict'

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
    this.bucket = 'ali-oss-test-object-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = 'oss-cn-hangzhou';
    yield this.store.clients[0].putBucket(this.bucket, this.region);
    this.store.clients[0].useBucket(this.bucket, this.region);
    this.store.clients[1].useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store.clients[0], this.bucket, this.region);
  });

  describe('init', function () {
    it('require options.cluster to be an array', function () {
      (function () {
        cluster({});
      }).should.throw('require options.cluster to be an array');
    });

    it('options.cluster require accessKeyId and accessKeySecret', function () {
      (function () {
        cluster({cluster: [{accessKeyId: 'xxx'}]});
      }).should.throw('options.cluster require accessKeyId and accessKeySecret');
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
      mm(this.store.clients[1], 'get', 'mock error');
      function onerror(err) {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = yield this.store.get(this.name);
      res.res.status.should.equal(200);
      mm.restore();
      mm(this.store.clients[0], 'get', 'mock error');
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
      function onerror(err) {
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
        let res = yield this.store.get(this.name);
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
        let res = yield this.store.get(this.name);
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
        let res = yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('AllServerDownError');
      }
    });
  });
});
