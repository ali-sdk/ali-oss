'use strict';

const oss = require('../');
const cluster = require('../').ClusterClient;
const config = require('./config').oss;
const utils = require('./utils');
const assert = require('assert');
const mm = require('mm');

describe('test/cluster.test.js', () => {
  var prefix = utils.prefix;
  afterEach(mm.restore);

  before(function* () {
    this.region = config.region;
    this.bucket1 = 'ali-oss-test-cluster1-' + prefix.replace(/[\/\.]/g, '');
    this.bucket2 = 'ali-oss-test-cluster2-' + prefix.replace(/[\/\.]/g, '');
    const client = oss(config);
    yield client.putBucket(this.bucket1, this.region);
    yield client.putBucket(this.bucket2, this.region);
  });

  before(function(done) {
    let options = {
      cluster: [
        {
          accessKeyId: config.accessKeyId,
          accessKeySecret: config.accessKeySecret,
          bucket: this.bucket1,
          endpoint: config.endpoint
        },
        {
          accessKeyId: config.accessKeyId,
          accessKeySecret: config.accessKeySecret,
          bucket: this.bucket2,
          endpoint: config.endpoint
        },
      ]
    };
    this.store = cluster(options);
    this.store.on('error', function(err) {
      if (err.name === 'MockError' || err.name === 'CheckAvailableError') {
        return;
      }
      console.error(err.stack);
    });
    this.store.ready(done);
  });

  after(function* () {
    yield utils.cleanBucket(this.store.clients[0], this.bucket1, this.region);
    yield utils.cleanBucket(this.store.clients[1], this.bucket2, this.region);
    this.store.close();
  });

  describe('init', function () {
    it('require options.cluster to be an array', function () {
      (function () {
        cluster({});
      }).should.throw('require options.cluster to be an array');
    });

    it('should _init() _checkAvailable throw error', function(done) {
      this.store.once('error', function(err) {
        err.message.should.equal('mock error');
        done();
      });
      mm.error(this.store, '_checkAvailable', 'mock error');
      this.store._init();
    });

    it('should skip put status file when ignoreStatusFile is set', function* () {
      mm.error(this.store, 'put', 'mock error');
      yield this.store._checkAvailable(true);
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

    it('should RR get from clients[1] when clients[0] not available', function* () {
      this.store.index = 0;
      mm(this.store.availables, '0', false);
      mm.data(this.store.clients[0], 'get', 'foo');
      let r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);

      // again should work
      r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
    });

    it('should RR get from clients[1] when clients[0] error ok', function* () {
      this.store.index = 0;
      mm.error(this.store.clients[0], 'get', 'mock error');
      let r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
    });

    it('should RR get from clients[0] when clients[1] not available', function* () {
      this.store.index = 0;
      mm(this.store.availables, '1', false);
      mm.data(this.store.clients[1], 'get', 'foo');
      let r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);
    });

    it('should RR get from clients[0] when clients[1] error ok', function* () {
      this.store.index = 0;
      mm.error(this.store.clients[1], 'get', 'mock error');
      let r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = yield this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
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
      try {
        yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('MockError');
        err.message.should.equal('mock error (all clients are down)');
      }
    });

    it('should MS error when clients all down', function* () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'get', 'mock error');
      mm.error(this.store.clients[1], 'get', 'mock error');
      try {
        yield this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('MockError');
        err.message.should.equal('mock error (all clients are down)');
      }
    });

    it('should RR throw error when read err status >= 200 && < 500', function* () {
      mm(this.store.clients[0], 'get', function*() {
        const err = new Error('mock error');
        throw err;
      });
      mm(this.store.clients[1], 'get', function*() {
        const err = new Error('mock 302 error');
        err.status = 302;
        throw err;
      });

      this.store.index = 0;
      try {
        yield this.store.get(this.name);
        throw new Error('should not run this');
      } catch (err) {
        err.status.should.equal(302);
      }

      mm(this.store.clients[0], 'get', function*() {
        const err = new Error('mock 404 error');
        err.status = 404;
        throw err;
      });
      mm(this.store.clients[1], 'get', function*() {
        const err = new Error('mock error');
        throw err;
      });
      this.store.index = 1;
      try {
        yield this.store.get(this.name);
        throw new Error('should not run this');
      } catch (err) {
        err.status.should.equal(404);
      }
    });

    it('should RR use the first client when all server down', function* () {
      mm(this.store.availables, '0', false);
      mm(this.store.availables, '1', false);

      this.store.index = 0;
      yield this.store.get(this.name);

      this.store.index = 1;
      yield this.store.get(this.name);
    });
  });

  describe('signatureUrl(), getObjectUrl()', function () {
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

    it('should get object cdn url', function() {
      const url = this.store.getObjectUrl(this.name);
      assert(/\.aliyuncs\.com\//.test(url), url);
      assert(/\/ali-sdk\/oss\/get-meta\.js$/.test(url), url);

      const cdnurl = this.store.getObjectUrl(this.name, 'https://foo.com');
      assert(/^https:\/\/foo\.com\//.test(cdnurl), cdnurl);
      assert(/\/ali-sdk\/oss\/get-meta\.js$/.test(cdnurl), cdnurl);
    });

    it('should RR signatureUrl from clients ok', function () {
      mm(this.store.clients[1], 'head', 'mock error');
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
      mm.restore();
      mm(this.store.clients[0], 'head', 'mock error');
      url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should RR signature from clients[1] when clients[0] error ok', function () {
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should MS always signature from clients[0] ok', function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store.clients[1], 'head', 'mock error');
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
      url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should signature from clients[0] when clients[0] response 4xx ok', function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'head', 'mock error', {status: 403});
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should signature ok when clients all down', function () {
      mm.error(this.store.clients[0], 'head', 'mock error');
      mm.error(this.store.clients[1], 'head', 'mock error');
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should RR use the first client when all server down', function () {
      mm(this.store.availables, '0', false);
      mm(this.store.availables, '1', false);

      this.store.index = 0;
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);

      this.store.index = 1;
      url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should masterSlave use the first client when all server down', function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store.availables, '0', false);
      mm(this.store.availables, '1', false);

      this.store.index = 0;
      let url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);

      this.store.index = 1;
      url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });
  });

  describe('_checkAvailable()', function() {
    it('should write status file on the first check', function*() {
      yield this.store._checkAvailable(true);
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should write status pass', function*() {
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should available on err status 404', function*() {
      mm(this.store.clients[0], 'head', function*() {
        const err = new Error('mock 404 error');
        err.status = 404;
        throw err;
      });

      mm(this.store.clients[1], 'head', function*() {
        const err = new Error('mock 300 error');
        err.status = 300;
        throw err;
      });
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should not available on err status < 200 or >= 500', function*() {
      mm(this.store.clients[0], 'head', function*() {
        const err = new Error('mock -1 error');
        err.status = -1;
        throw err;
      });

      mm(this.store.clients[1], 'head', function*() {
        const err = new Error('mock 500 error');
        err.status = 500;
        throw err;
      });
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(false);
    });

    it('should available on error count < 3', function*() {
      // client[0] error 2 times
      let count = 0;
      mm(this.store.clients[0], 'head', function*(name) {
        count++;
        if (count === 3) {
          return { name: name };
        }
        throw new Error('mock error');
      });
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
      count.should.equal(3);
      mm.restore();

      // client[1] error 1 times
      count = 0;
      mm(this.store.clients[1], 'head', function*(name) {
        count++;
        if (count === 2) {
          return { name: name };
        }
        throw new Error('mock error');
      });
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
      count.should.equal(2);
    });

    it('should try 3 times on check status fail', function*() {
      // client[0] error
      mm.error(this.store.clients[0], 'head', 'mock error');
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(true);
      mm.restore();

      // client[1] error
      mm.error(this.store.clients[1], 'head', 'mock error');
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(false);
      mm.restore();

      // all down
      mm.error(this.store.clients[0], 'head', 'mock error');
      mm.error(this.store.clients[1], 'head', 'mock error');
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(false);
      mm.restore();

      // recover
      yield this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });
  });
});
