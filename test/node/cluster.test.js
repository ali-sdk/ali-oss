
const oss = require('../..');
const cluster = require('../..').ClusterClient;
const config = require('../config').oss;
const utils = require('./utils');
const assert = require('assert');
const mm = require('mm');

describe('test/cluster.test.js', () => {
  const { prefix } = utils;
  afterEach(mm.restore);

  before(async function () {
    this.region = config.region;
    this.bucket1 = `ali-oss-test-cluster1-${prefix.replace(/[/.]/g, '')}`;
    this.bucket2 = `ali-oss-test-cluster2-${prefix.replace(/[/.]/g, '')}`;
    const client = oss(config);
    await client.putBucket(this.bucket1);
    await client.putBucket(this.bucket2);
  });

  before(function (done) {
    const options = {
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
        }
      ]
    };
    this.store = cluster(options);
    this.store.on('error', (err) => {
      if (err.name === 'MockError' || err.name === 'CheckAvailableError') {
        return;
      }
      console.error(err.stack);
    });
    this.store.ready(done);
  });


  describe('init', () => {
    it('require options.cluster to be an array', () => {
      (function () {
        cluster({});
      }).should.throw('require options.cluster to be an array');
    });

    it('should _init() _checkAvailable throw error', function (done) {
      this.store.once('error', (err) => {
        err.message.should.equal('mock error');
        done();
      });
      mm.error(this.store, '_checkAvailable', 'mock error');
      this.store._init();
    });

    it('should skip put status file when ignoreStatusFile is set', async function () {
      mm.error(this.store, 'put', 'mock error');
      await this.store._checkAvailable(true);
    });
  });

  describe('put()', () => {
    it('should add object with local file path', async function () {
      const name = `${prefix}ali-sdk/oss/put-localfile.js`;
      const object = await this.store.put(name, __filename, {
        timeout: 120000
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);
    });

    it('should error when any one is error', async function () {
      mm.error(this.store.clients[1], 'put', 'mock error');
      const name = `${prefix}ali-sdk/oss/put-localfile.js`;
      try {
        await this.store.put(name, __filename);
        throw new Error('should never exec');
      } catch (err) {
        err.message.should.equal('mock error');
      }
    });

    it('should ignore when any one is error', async function () {
      mm.error(this.store.clients[1], 'put', 'mock error');
      const name = `${prefix}ali-sdk/oss/put-localfile.js`;
      try {
        await this.store.put(name, __filename);
        throw new Error('should never exec');
      } catch (err) {
        err.message.should.equal('mock error');
      }
    });
  });

  describe('putACL() and getACL()', () => {
    it('should add object with local file path', async function () {
      const name = `${prefix}ali-sdk/oss/put-localfile.js`;
      const object = await this.store.put(name, __filename);
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      let res = await this.store.getACL(name);
      assert.equal(res.acl, 'default');

      await this.store.putACL(name, 'public-read');
      res = await this.store.getACL(name);
      assert.equal(res.acl, 'public-read');
    });
  });

  describe('get()', () => {
    before(async function () {
      this.name = `${prefix}ali-sdk/oss/get-meta.js`;
      const object = await this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should RR get from clients ok', async function () {
      mm(this.store.clients[1], 'get', async () => {
        throw new Error('mock error');
      });
      function onerror(err) {
        throw err;
      }
      this.store.on('error', onerror);

      let res = await this.store.get(this.name);
      res.res.status.should.equal(200);
      mm.restore();
      mm(this.store.clients[0], 'get', async () => {
        throw new Error('mock error');
      });
      res = await this.store.get(this.name);
      res.res.status.should.equal(200);

      this.store.removeListener('error', onerror);
    });

    it('should RR get from clients[1] when clients[0] not available', async function () {
      this.store.index = 0;
      mm(this.store.availables, '0', false);
      mm.data(this.store.clients[0], 'get', 'foo');
      let r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);

      // again should work
      r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
    });

    it('should RR get from clients[1] when clients[0] error ok', async function () {
      this.store.index = 0;
      mm.error(this.store.clients[0], 'get', 'mock error');
      let r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
    });

    it('should RR get from clients[0] when clients[1] not available', async function () {
      this.store.index = 0;
      mm(this.store.availables, '1', false);
      mm.data(this.store.clients[1], 'get', 'foo');
      let r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);
    });

    it('should RR get from clients[0] when clients[1] error ok', async function () {
      this.store.index = 0;
      mm.error(this.store.clients[1], 'get', 'mock error');
      let r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(1);

      // again should work
      r = await this.store.get(this.name);
      r.res.status.should.equal(200);
      this.store.index.should.equal(0);
    });

    it('should MS always get from clients[0] ok', async function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store.clients[1], 'get', 'mock error');
      function onerror() {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = await this.store.get(this.name);
      res.res.status.should.equal(200);
      res = await this.store.get(this.name);
      res.res.status.should.equal(200);

      this.store.removeListener('error', onerror);
    });

    it('should MS always get from clients[0] when masterOnly === true', async function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm(this.store, 'masterOnly', true);
      mm(this.store.clients[1], 'get', 'mock error');
      function onerror() {
        throw new Error('should not emit error event');
      }
      this.store.on('error', onerror);

      let res = await this.store.get(this.name);
      res.res.status.should.equal(200);
      res = await this.store.get(this.name);
      res.res.status.should.equal(200);

      this.store.removeListener('error', onerror);
    });

    it('should get from clients[0] when clients[0] response 4xx ok', async function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'get', 'mock error', { status: 403 });
      try {
        await this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.status.should.equal(403);
      }
    });

    it('should RR error when clients all down', async function () {
      mm.error(this.store.clients[0], 'get', 'mock error');
      mm.error(this.store.clients[1], 'get', 'mock error');
      try {
        await this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('MockError');
        err.message.should.equal('mock error (all clients are down)');
      }
    });

    it('should MS error when clients all down', async function () {
      mm(this.store, 'schedule', 'masterSlave');
      mm.error(this.store.clients[0], 'get', 'mock error');
      mm.error(this.store.clients[1], 'get', 'mock error');
      try {
        await this.store.get(this.name);
        throw new Error('should never exec');
      } catch (err) {
        err.name.should.equal('MockError');
        err.message.should.equal('mock error (all clients are down)');
      }
    });

    it('should RR throw error when read err status >= 200 && < 500', async function () {
      mm(this.store.clients[0], 'get', async () => {
        const err = new Error('mock error');
        throw err;
      });
      mm(this.store.clients[1], 'get', async () => {
        const err = new Error('mock 302 error');
        err.status = 302;
        throw err;
      });

      this.store.index = 0;
      try {
        await this.store.get(this.name);
        throw new Error('should not run this');
      } catch (err) {
        err.status.should.equal(302);
      }

      mm(this.store.clients[0], 'get', async () => {
        const err = new Error('mock 404 error');
        err.status = 404;
        throw err;
      });
      mm(this.store.clients[1], 'get', async () => {
        const err = new Error('mock error');
        throw err;
      });
      this.store.index = 1;
      try {
        await this.store.get(this.name);
        throw new Error('should not run this');
      } catch (err) {
        err.status.should.equal(404);
      }
    });

    it('should RR use the first client when all server down', async function () {
      mm(this.store.availables, '0', false);
      mm(this.store.availables, '1', false);

      this.store.index = 0;
      await this.store.get(this.name);

      this.store.index = 1;
      await this.store.get(this.name);
    });
  });

  describe('signatureUrl(), getObjectUrl()', () => {
    before(async function () {
      this.name = `${prefix}ali-sdk/oss/get-meta.js`;
      const object = await this.store.put(this.name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      this.headers = object.res.headers;
    });

    it('should get object cdn url', function () {
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
      const url = this.store.signatureUrl(this.name);
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
      mm.error(this.store.clients[0], 'head', 'mock error', { status: 403 });
      const url = this.store.signatureUrl(this.name);
      url.should.match(/ali-sdk\/oss\/get-meta\.js/);
    });

    it('should signature ok when clients all down', function () {
      mm.error(this.store.clients[0], 'head', 'mock error');
      mm.error(this.store.clients[1], 'head', 'mock error');
      const url = this.store.signatureUrl(this.name);
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

  describe('_checkAvailable()', () => {
    it('should write status file on the first check', async function () {
      await this.store._checkAvailable(true);
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should write status pass', async function () {
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should available on err status 404', async function () {
      mm(this.store.clients[0], 'head', async () => {
        const err = new Error('mock 404 error');
        err.status = 404;
        throw err;
      });

      mm(this.store.clients[1], 'head', async () => {
        const err = new Error('mock 300 error');
        err.status = 300;
        throw err;
      });
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });

    it('should not available on err status < 200 or >= 500', async function () {
      mm(this.store.clients[0], 'head', async () => {
        const err = new Error('mock -1 error');
        err.status = -1;
        throw err;
      });

      mm(this.store.clients[1], 'head', async () => {
        const err = new Error('mock 500 error');
        err.status = 500;
        throw err;
      });
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(false);
    });

    it('should available on error count < 3', async function () {
      // client[0] error 2 times
      let count = 0;
      mm(this.store.clients[0], 'head', async (name) => {
        count++;
        if (count === 3) {
          return { name };
        }
        throw new Error('mock error');
      });
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
      count.should.equal(3);
      mm.restore();

      // client[1] error 1 times
      count = 0;
      mm(this.store.clients[1], 'head', async (name) => {
        count++;
        if (count === 2) {
          return { name };
        }
        throw new Error('mock error');
      });
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
      count.should.equal(2);
    });

    it('should try 3 times on check status fail', async function () {
      // client[0] error
      mm.error(this.store.clients[0], 'head', 'mock error');
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(true);
      mm.restore();

      // client[1] error
      mm.error(this.store.clients[1], 'head', 'mock error');
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(false);
      mm.restore();

      // all down
      mm.error(this.store.clients[0], 'head', 'mock error');
      mm.error(this.store.clients[1], 'head', 'mock error');
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(false);
      this.store.availables['1'].should.equal(false);
      mm.restore();

      // recover
      await this.store._checkAvailable();
      this.store.availables['0'].should.equal(true);
      this.store.availables['1'].should.equal(true);
    });
  });
});
