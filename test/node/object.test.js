
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Readable } = require('stream');
const AgentKeepalive = require('agentkeepalive');
const HttpsAgentKeepalive = require('agentkeepalive').HttpsAgent;
const sleep = require('mz-modules/sleep');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;
const urllib = require('urllib');
const copy = require('copy-to');
const mm = require('mm');
const streamEqual = require('stream-equal');
const crypto = require('crypto');
const urlutil = require('url');
const request = require('request');

const tmpdir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpdir)) {
  fs.mkdirSync(tmpdir);
}

describe('test/object.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  let bucketRegion;
  let archvieBucket;
  before(async () => {
    store = oss(config);
    bucket = `ali-oss-test-object-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);

    // just for archive bucket test
    archvieBucket = `oss-archvie-bucket-${prefix.replace(/[/.]/g, '-')}`;
    archvieBucket = archvieBucket.substring(0, archvieBucket.length - 1);

    bucketRegion = config.region;
    // console.log('current buckets: %j',
    //   (yield store.listBuckets()).buckets.map(function (item) {
    //     return item.name + ':' + item.region;
    //   })
    // );
    await store.putBucket(bucket);
    store.useBucket(bucket, bucketRegion);

    await store.putBucket(archvieBucket, { StorageClass: 'Archive' });
    // store.useBucket(archvieBucket, bucketRegion);
  });

  after(async () => {
    await utils.cleanBucket(store, bucket);
    await utils.cleanBucket(store, archvieBucket);
  });

  describe('putStream()', () => {
    afterEach(mm.restore);

    it('should add object with streaming way', async () => {
      const name = `${prefix}ali-sdk/oss/putStream-localfile.js`;
      const object = await store.putStream(name, fs.createReadStream(__filename));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);
      assert(object.url);

      // check content
      const r = await store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.content.toString(), fs.readFileSync(__filename, 'utf8'));
    });

    it('should use chunked encoding', async () => {
      const name = `${prefix}ali-sdk/oss/chunked-encoding.js`;
      let header;
      const req = store.urllib.request;
      mm(store.urllib, 'request', (url, args) => {
        header = args.headers;
        return req(url, args);
      });

      const result = await store.putStream(name, fs.createReadStream(__filename));

      assert.equal(result.res.status, 200);
      assert.equal(header['Transfer-Encoding'], 'chunked');
    });

    it('should NOT use chunked encoding', async () => {
      const name = `${prefix}ali-sdk/oss/no-chunked-encoding.js`;
      let header;
      const req = store.urllib.request;
      mm(store.urllib, 'request', (url, args) => {
        header = args.headers;
        return req(url, args);
      });

      const options = {
        contentLength: fs.statSync(__filename).size
      };
      const result = await store.putStream(name, fs.createReadStream(__filename), options);

      assert(!header['Transfer-Encoding']);
      assert.equal(result.res.status, 200);
    });

    it('should add image with file streaming way', async () => {
      const name = `${prefix}ali-sdk/oss/nodejs-1024x768.png`;
      const imagepath = path.join(__dirname, 'nodejs-1024x768.png');
      const object = await store.putStream(name, fs.createReadStream(imagepath), {
        mime: 'image/png'
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      // check content
      const r = await store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.res.headers['content-type'], 'image/png');
      const buf = fs.readFileSync(imagepath);
      assert.equal(r.content.length, buf.length);
      assert.deepEqual(r.content, buf);
    });

    it('should put object with http streaming way', async () => {
      const name = `${prefix}ali-sdk/oss/nodejs-1024x768.png`;
      const nameCpy = `${prefix}ali-sdk/oss/nodejs-1024x768`;
      const imagepath = path.join(__dirname, 'nodejs-1024x768.png');
      await store.putStream(name, fs.createReadStream(imagepath), { mime: 'image/png' });
      const signUrl = store.signatureUrl(name, { expires: 3600 });
      const httpStream = request(signUrl);
      let result = await store.putStream(nameCpy, httpStream);
      assert.equal(result.res.status, 200);
      result = await store.get(nameCpy);
      assert.equal(result.res.status, 200);
      assert.equal(result.res.headers['content-type'], 'application/octet-stream');
    });

    it('should add very big file: 4mb with streaming way', async () => {
      const name = `${prefix}ali-sdk/oss/bigfile-4mb.bin`;
      const bigfile = path.join(__dirname, '.tmp', 'bigfile-4mb.bin');
      fs.writeFileSync(bigfile, Buffer.alloc(4 * 1024 * 1024).fill('a\n'));
      const object = await store.putStream(name, fs.createReadStream(bigfile));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      // check content
      const r = await store.get(name);
      assert.equal(r.res.status, 200);
      assert.equal(r.res.headers['content-type'], 'application/octet-stream');
      assert.equal(r.res.size, 4 * 1024 * 1024);
      const buf = fs.readFileSync(bigfile);
      assert.equal(r.content.length, buf.length);
      assert.deepEqual(r.content, buf);
    });
  });

  describe('processObjectSave()', () => {
    const name = 'sourceObject.png';
    before(async () => {
      const imagepath = path.join(__dirname, 'nodejs-1024x768.png');
      await store.putStream(name, fs.createReadStream(imagepath), {
        mime: 'image/png'
      });
    });
    const target = `processObject_target${Date.now()}.jpg`;
    it('should process image', async () => {
      try {
        const result = await store.processObjectSave(name, target, 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,');
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false, error);
      }
    });
    it('should process image with targetBucket', async () => {
      try {
        const result = await store.processObjectSave(name, target, 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,', archvieBucket);
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false, error);
      }
    });
    it('should throw error when sourceObjectName is invalid', async () => {
      try {
        await store.processObjectSave('', target, 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,');
        assert(false);
      } catch (error) {
        assert(error.message.includes('required'));
      }
      try {
        await store.processObjectSave({}, target, 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,');
        assert(false);
      } catch (error) {
        assert(error.message.includes('must be String'));
      }
    });
    it('should throw error when targetObjectName is invalid', async () => {
      try {
        await store.processObjectSave(name, '', 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,');
        assert(false);
      } catch (error) {
        assert(error.message.includes('required'));
      }
      try {
        await store.processObjectSave(name, {}, 'image/watermark,text_aGVsbG8g5Zu+54mH5pyN5Yqh77yB,color_ff6a00,');
        assert(false);
      } catch (error) {
        assert(error.message.includes('must be String'));
      }
    });
    it('should throw error when process is invalid', async () => {
      try {
        await store.processObjectSave(name, target, '');
        assert(false);
      } catch (error) {
        assert(error.message.includes('required'));
      }
      try {
        await store.processObjectSave(name, target, {});
        assert(false);
      } catch (error) {
        assert(error.message.includes('must be String'));
      }
    });
  });

  describe('getObjectUrl()', () => {
    it('should return object url', () => {
      let name = 'test.js';
      let url = store.getObjectUrl(name);
      assert.equal(url, store.options.endpoint.format() + name);

      name = '/foo/bar/a%2Faa/test&+-123~!.js';
      url = store.getObjectUrl(name, 'https://foo.com');
      assert.equal(url, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
      const url2 = store.getObjectUrl(name, 'https://foo.com/');
      assert.equal(url2, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
    });
  });

  describe('generateObjectUrl()', () => {
    it('should return object url', () => {
      let name = 'test.js';
      let url = store.generateObjectUrl(name);

      let baseUrl = store.options.endpoint.format();
      const copyUrl = urlutil.parse(baseUrl);
      copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
      copyUrl.host = `${bucket}.${copyUrl.host}`;
      baseUrl = copyUrl.format();
      assert.equal(url, `${baseUrl}${name}`);

      name = '/foo/bar/a%2Faa/test&+-123~!.js';
      url = store.generateObjectUrl(name, 'https://foo.com');
      assert.equal(url, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
      const url2 = store.generateObjectUrl(name, 'https://foo.com/');
      assert.equal(url2, 'https://foo.com/foo/bar/a%252Faa/test%26%2B-123~!.js');
    });
  });

  describe('put()', () => {
    it('should add object with local file path', async () => {
      const name = `${prefix}ali-sdk/oss/put-localfile.js`;
      const object = await store.put(name, __filename);
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);
    });

    it('should add object with content buffer', async () => {
      const name = `${prefix}ali-sdk/oss/put-buffer`;
      const object = await store.put(`/${name}`, Buffer.from('foo content'));
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert(object.name, name);
    });

    it('should add object with readstream', async () => {
      const name = `${prefix}ali-sdk/oss/put-readstream`;
      const stat = await store._statFile(__filename);
      const object = await store.put(name, fs.createReadStream(__filename), {
        headers: {
          'Content-Length': stat.size
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(typeof object.res.headers.etag, 'string');
      assert(object.name, name);
    });

    it('should add object with meta', async () => {
      const name = `${prefix}ali-sdk/oss/put-meta.js`;
      const object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      assert.equal(typeof object.res.rt, 'number');
      assert.equal(object.res.size, 0);
      assert(object.name, name);

      const info = await store.head(name);
      assert.deepEqual(info.meta, {
        uid: '1',
        slus: 'test.html'
      });
      assert.equal(info.status, 200);
    });

    it('should set Content-Disposition with ascii name', async () => {
      const name = `${prefix}ali-sdk/oss/put-Content-Disposition.js`;
      const object = await store.put(name, __filename, {
        headers: {
          'Content-Disposition': 'ascii-name.js'
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      assert.equal(info.res.headers['content-disposition'], 'ascii-name.js');
    });

    it('should set Content-Disposition with no-ascii name', async () => {
      const name = `${prefix}ali-sdk/oss/put-Content-Disposition.js`;
      const object = await store.put(name, __filename, {
        headers: {
          'Content-Disposition': encodeURIComponent('non-ascii-名字.js')
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      assert.equal(info.res.headers['content-disposition'], 'non-ascii-%E5%90%8D%E5%AD%97.js');
    });

    it('should set Expires', async () => {
      const name = `${prefix}ali-sdk/oss/put-Expires.js`;
      const object = await store.put(name, __filename, {
        headers: {
          Expires: 1000000
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      assert.equal(info.res.headers.expires, '1000000');
    });

    it('should set custom Content-Type', async () => {
      const name = `${prefix}ali-sdk/oss/put-Content-Type.js`;
      const object = await store.put(name, __filename, {
        headers: {
          'Content-Type': 'text/plain; charset=gbk'
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      assert.equal(info.res.headers['content-type'], 'text/plain; charset=gbk');
    });

    it('should set custom content-type lower case', async () => {
      const name = `${prefix}ali-sdk/oss/put-Content-Type.js`;
      const object = await store.put(name, __filename, {
        headers: {
          'content-type': 'application/javascript; charset=utf8'
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      assert.equal(info.res.headers['content-type'], 'application/javascript; charset=utf8');
    });

    it('should return correct encode when name include + and space', async () => {
      const name = 'ali-sdkhahhhh+oss+mm xxx.js';
      const object = await store.put(name, __filename, {
        headers: {
          'Content-Type': 'text/plain; charset=gbk'
        }
      });
      assert(object.name, name);
      const info = await store.head(name);
      const url = info.res.requestUrls[0];
      const { pathname } = urlutil.parse(url);
      assert.equal(pathname, '/ali-sdkhahhhh%2Boss%2Bmm%20xxx.js');
      assert.equal(info.res.headers['content-type'], 'text/plain; charset=gbk');
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

  describe('mimetype', () => {
    const createFile = async (name, size) => {
      size = size || 200 * 1024;
      await new Promise(((resolve, reject) => {
        const rs = fs.createReadStream('/dev/random', {
          start: 0,
          end: size - 1
        });
        const ws = fs.createWriteStream(name);
        rs.pipe(ws);
        ws.on('finish', (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }));

      return name;
    };

    it('should set mimetype by file ext', async () => {
      const filepath = path.join(tmpdir, 'content-type-by-file.jpg');
      await createFile(filepath);
      const name = `${prefix}ali-sdk/oss/content-type-by-file.png`;
      await store.put(name, filepath);

      let result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/jpeg');

      await store.multipartUpload(name, filepath);
      result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/jpeg');
    });

    it('should set mimetype by object key', async () => {
      const filepath = path.join(tmpdir, 'content-type-by-file');
      await createFile(filepath);
      const name = `${prefix}ali-sdk/oss/content-type-by-file.png`;
      await store.put(name, filepath);

      let result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/png');
      await store.multipartUpload(name, filepath);
      result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'image/png');
    });

    it('should set user-specified mimetype', async () => {
      const filepath = path.join(tmpdir, 'content-type-by-file.jpg');
      await createFile(filepath);
      const name = `${prefix}ali-sdk/oss/content-type-by-file.png`;
      await store.put(name, filepath, { mime: 'text/plain' });

      let result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'text/plain');
      await store.multipartUpload(name, filepath, {
        mime: 'text/plain'
      });
      result = await store.head(name);
      assert.equal(result.res.headers['content-type'], 'text/plain');
    });
  });

  describe('head()', () => {
    let name;
    let resHeaders;
    before(async () => {
      name = `${prefix}ali-sdk/oss/head-meta.js`;
      const object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      resHeaders = object.res.headers;
    });

    it('should head not exists object throw NoSuchKeyError', async () => {
      await utils.throws(async () => {
        await store.head(`${name}not-exists`);
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
      });
    });

    it('should head exists object with If-Modified-Since < object modified time', async () => {
      let lastYear = new Date(resHeaders.date);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear = lastYear.toGMTString();
      const info = await store.head(name, {
        headers: {
          'If-Modified-Since': lastYear
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Modified-Since = object modified time', async () => {
      const info = await store.head(name, {
        headers: {
          'If-Modified-Since': resHeaders.date
        }
      });
      assert.equal(info.status, 304);
      assert.equal(info.meta, null);
    });

    it('should head exists object with If-Modified-Since > object modified time', async () => {
      let nextYear = new Date(resHeaders.date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear = nextYear.toGMTString();

      const info = await store.head(name, {
        headers: {
          'If-Modified-Since': nextYear
        }
      });
      assert.equal(info.status, 304);
      assert.equal(info.meta, null);
    });

    it('should head exists object with If-Unmodified-Since < object modified time', async () => {
      let lastYear = new Date(resHeaders.date);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear = lastYear.toGMTString();
      await utils.throws(async () => {
        await store.head(name, {
          headers: {
            'If-Unmodified-Since': lastYear
          }
        });
      }, (err) => {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      });
    });

    it('should head exists object with If-Unmodified-Since = object modified time', async () => {
      const info = await store.head(name, {
        headers: {
          'If-Unmodified-Since': resHeaders.date
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Unmodified-Since > object modified time', async () => {
      let nextYear = new Date(resHeaders.date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear = nextYear.toGMTString();

      const info = await store.head(name, {
        headers: {
          'If-Unmodified-Since': nextYear
        }
      });
      assert.equal(info.status, 200);
      assert(info.meta);
    });

    it('should head exists object with If-Match equal etag', async () => {
      const info = await store.head(name, {
        headers: {
          'If-Match': resHeaders.etag
        }
      });
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });

    it('should head exists object with If-Match not equal etag', async () => {
      await utils.throws(async () => {
        await store.head(name, {
          headers: {
            'If-Match': '"foo-etag"'
          }
        });
      }, (err) => {
        assert.equal(err.name, 'PreconditionFailedError');
        assert.equal(err.status, 412);
      });
    });

    it('should head exists object with If-None-Match equal etag', async () => {
      const info = await store.head(name, {
        headers: {
          'If-None-Match': resHeaders.etag
        }
      });
      assert.equal(info.meta, null);
      assert.equal(info.status, 304);
    });

    it('should head exists object with If-None-Match not equal etag', async () => {
      const info = await store.head(name, {
        headers: {
          'If-None-Match': '"foo-etag"'
        }
      });
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });
  });

  describe('getObjectMeta()', () => {
    let name;
    let resHeaders;
    let fileSize;
    before(async () => {
      name = `${prefix}ali-sdk/oss/object-meta.js`;
      const object = await store.put(name, __filename);
      fileSize = fs.statSync(__filename).size;
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      resHeaders = object.res.headers;
    });

    it('should head not exists object throw NoSuchKeyError', async () => {
      await utils.throws(async () => {
        await store.head(`${name}not-exists`);
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
      });
    });

    it('should return Etag and Content-Length', async () => {
      const info = await store.getObjectMeta(name);
      assert.equal(info.status, 200);
      assert.equal(info.res.headers.etag, resHeaders.etag);
      assert.equal(info.res.headers['content-length'], fileSize);
    });
  });

  describe('get()', () => {
    let name;
    let resHeaders;
    let needEscapeName;
    before(async () => {
      name = `${prefix}ali-sdk/oss/get-meta.js`;
      let object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      resHeaders = object.res.headers;

      needEscapeName = `${prefix}ali-sdk/oss/%3get+meta.js`;
      object = await store.put(needEscapeName, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should store object to local file', async () => {
      const savepath = path.join(tmpdir, name.replace(/\//g, '-'));
      const result = await store.get(name, savepath);
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should escape uri path ok', async () => {
      const savepath = path.join(tmpdir, needEscapeName.replace(/\//g, '-'));
      const result = await store.get(needEscapeName, savepath);
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should throw error when save path parent dir not exists', async () => {
      const savepath = path.join(tmpdir, 'not-exists', name.replace(/\//g, '-'));
      await utils.throws(async () => {
        await store.get(name, savepath);
      }, /ENOENT/);
    });

    it('should store object to writeStream', async () => {
      const savepath = path.join(tmpdir, name.replace(/\//g, '-'));
      const result = await store.get(name, fs.createWriteStream(savepath));
      assert.equal(result.res.status, 200);
      assert.equal(fs.statSync(savepath).size, fs.statSync(__filename).size);
    });

    it('should store not exists object to file', async () => {
      const savepath = path.join(tmpdir, name.replace(/\//g, '-'));
      await utils.throws(async () => {
        await store.get(`${name}not-exists`, savepath);
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert(!fs.existsSync(savepath));
      });
    });

    it('should throw error when writeStream emit error', async () => {
      const savepath = path.join(tmpdir, 'not-exists-dir', name.replace(/\//g, '-'));
      await utils.throws(async () => {
        await store.get(name, fs.createWriteStream(savepath));
      }, /ENOENT/);
    });

    it('should get object content buffer', async () => {
      let result = await store.get(name);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);

      result = await store.get(name, null);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
    });

    it('should get object content buffer with image process', async () => {
      const imageName = `${prefix}ali-sdk/oss/nodejs-test-get-image-1024x768.png`;
      const originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
      path.join(__dirname, 'nodejs-processed-w200.png');
      await store.put(imageName, originImagePath, {
        mime: 'image/png'
      });

      let result = await store.get(imageName, { process: 'image/resize,w_200' });
      assert.equal(result.res.status, 200);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
      // assert.deepEqual(result.content == fs.readFileSync(processedImagePath),
      //   'get content should be same as test/nodejs-processed-w200.png');

      // it should use the value of process
      // when 'subres.x-oss-process' coexists with 'process'.
      result = await store.get(
        imageName,
        { process: 'image/resize,w_200', subres: { 'x-oss-process': 'image/resize,w_100' } }
      );
      assert.equal(result.res.status, 200);
      assert(Buffer.isBuffer(result.content), 'content should be Buffer');
    });

    it('should throw NoSuchKeyError when object not exists', async () => {
      await utils.throws(async () => {
        await store.get('not-exists-key');
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
        assert.equal(typeof err.requestId, 'string');
        assert.equal(err.message, 'The specified key does not exist.');
      });
    });

    describe('If-Modified-Since header', () => {
      it('should 200 when If-Modified-Since < object modified time', async () => {
        let lastYear = new Date(resHeaders.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        const result = await store.get(name, {
          headers: {
            'If-Modified-Since': lastYear
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
        assert.equal(result.res.status, 200);
      });

      it('should 304 when If-Modified-Since = object modified time', async () => {
        const result = await store.get(name, {
          headers: {
            'If-Modified-Since': resHeaders.date
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.length, 0);
        assert.equal(result.res.status, 304);
      });

      it('should 304 when If-Modified-Since > object modified time', async () => {
        let nextYear = new Date(resHeaders.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        const result = await store.get(name, {
          headers: {
            'If-Modified-Since': nextYear
          }
        });
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.length, 0);
        assert.equal(result.res.status, 304);
      });
    });

    describe('If-Unmodified-Since header', () => {
      it('should throw PreconditionFailedError when If-Unmodified-Since < object modified time', async () => {
        let lastYear = new Date(resHeaders.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        await utils.throws(async () => {
          await store.get(name, {
            headers: {
              'If-Unmodified-Since': lastYear
            }
          });
        }, (err) => {
          assert.equal(err.status, 412);
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Unmodified-Since)');
          assert.equal(typeof err.requestId, 'string');
          assert.equal(typeof err.hostId, 'string');
        });
      });

      it('should 200 when If-Unmodified-Since = object modified time', async () => {
        const result = await store.get(name, {
          headers: {
            'If-Unmodified-Since': resHeaders.date
          }
        });
        assert.equal(result.res.status, 200);
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
      });

      it('should 200 when If-Unmodified-Since > object modified time', async () => {
        let nextYear = new Date(resHeaders.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        const result = await store.get(name, {
          headers: {
            'If-Unmodified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 200);
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert(result.content.toString().indexOf('ali-sdk/oss/get-meta.js') > 0);
      });
    });

    describe('If-Match header', () => {
      it('should 200 when If-Match equal object etag', async () => {
        const result = await store.get(name, {
          headers: {
            'If-Match': resHeaders.etag
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should throw PreconditionFailedError when If-Match not equal object etag', async () => {
        await utils.throws(async () => {
          await store.get(name, {
            headers: {
              'If-Match': 'foo'
            }
          });
        }, (err) => {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.status, 412);
        });
      });
    });

    describe('If-None-Match header', () => {
      it('should 200 when If-None-Match not equal object etag', async () => {
        const result = await store.get(name, {
          headers: {
            'If-None-Match': 'foo'
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should 304 when If-None-Match equal object etag', async () => {
        const result = await store.get(name, {
          headers: {
            'If-None-Match': resHeaders.etag
          }
        });
        assert.equal(result.res.status, 304);
        assert.equal(result.content.length, 0);
      });
    });

    describe('Range header', () => {
      it('should work with Range header and get top 10 bytes content', async () => {
        const content = Buffer.from('aaaaaaaaaabbbbbbbbbb');
        await store.put('range-header-test', content);
        const result = await store.get('range-header-test', {
          headers: {
            Range: 'bytes=0-9'
          }
        });
        assert.equal(result.res.headers['content-length'], '10');
        assert(Buffer.isBuffer(result.content), 'content should be Buffer');
        assert.equal(result.content.toString(), 'aaaaaaaaaa');
      });
    });
  });

  describe('signatureUrl()', () => {
    let name;
    let needEscapeName;
    before(async () => {
      name = `${prefix}ali-sdk/oss/signatureUrl.js`;
      let object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');

      needEscapeName = `${prefix}ali-sdk/oss/%3get+meta-signatureUrl.js`;
      object = await store.put(needEscapeName, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should signature url get object ok', async () => {
      const result = await store.get(name);
      const url = store.signatureUrl(name);
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

    it('should signature url with image processed and get object ok', async () => {
      const imageName = `${prefix}ali-sdk/oss/nodejs-test-signature-1024x768.png`;
      const originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
      path.join(__dirname, 'nodejs-processed-w200.png');
      await store.put(imageName, originImagePath, {
        mime: 'image/png'
      });

      const signUrl = store.signatureUrl(imageName, { expires: 3600, process: 'image/resize,w_200' });
      const processedKeyword = 'x-oss-process=image%2Fresize%2Cw_200';
      assert.equal(signUrl.match(processedKeyword), processedKeyword);
      const urlRes = await urllib.request(signUrl);
      assert.equal(urlRes.status, 200);
      // assert(urlRes.data.toString() == fs.readFileSync(processedImagePath, 'utf8'),
      //   'response content should be same as test/nodejs-processed-w200.png');
    });

    it('should signature url for PUT', async () => {
      const putString = 'Hello World';
      const contentMd5 = crypto.createHash('md5').update(Buffer.from(putString, 'utf8')).digest('base64');
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

    // TODO: the callback url is disable.
    // it('should signature url for PUT with callback parameter', async () => {
    //   const callback = {
    //     url: 'http://oss-demo.aliyuncs.com:23450',
    //     body: `bucket=${bucket}`,
    //     host: 'oss-demo.aliyuncs.com',
    //     contentType: 'application/json',
    //     customValue: {
    //       key1: 'value1',
    //       key2: 'value2'
    //     }
    //   };
    //
    //   const options = {
    //     method: 'PUT',
    //     expires: 3600,
    //     callback
    //   };
    //
    //   const url = store.signatureUrl(name, options);
    //   const res = await urllib.request(url, options);
    //   assert.equal(res.status, 200);
    // });

    it('should signature url get need escape object ok', async () => {
      const result = await store.get(needEscapeName);
      const url = store.signatureUrl(needEscapeName);
      const urlRes = await urllib.request(url);
      assert.equal(urlRes.data.toString(), result.content.toString());
    });

    it('should signature url with custom host ok', () => {
      const conf = {};
      copy(config).to(conf);
      conf.endpoint = 'www.aliyun.com';
      conf.cname = true;
      const tempStore = oss(conf);

      const url = tempStore.signatureUrl(name);
      // http://www.aliyun.com/darwin-v4.4.2/ali-sdk/oss/get-meta.js?OSSAccessKeyId=
      assert.equal(url.indexOf('http://www.aliyun.com/'), 0);
    });
    
    it('should signature url with traffic limit', async () => {
      const name = `${prefix}ali-sdk/oss/trafficLimit.js`;
      let url, result;
      const file_1mb = path.join(__dirname, '.tmp', 'bigfile-1mb.bin');
      fs.writeFileSync(file_1mb, Buffer.alloc(1 * 1024 * 1024).fill('a\n'));

      try {
        url = store.signatureUrl(name, {
          trafficLimit: 8 * 1024 * 100 * 4,
          method: 'PUT'
        })
      
        result = await store.urllib.request(url, {
          method: 'PUT',
          stream: fs.createReadStream(file_1mb),
          timeout: 600000,
        });
        assert.strictEqual(200, result.status)
      } catch (error) {
        assert(false, error.message)
      }
     
      try {
        url = store.signatureUrl(name, {
          trafficLimit: 8 * 1024 * 100 * 4,
        })
        result = await store.urllib.request(url, {
          timeout: 600000,
        });
        assert.strictEqual(200, result.status)
      } catch (error) {
        assert(false, error.message)
      }
    });
  });

  describe('getStream()', () => {
    let name;
    before(async () => {
      name = `${prefix}ali-sdk/oss/get-stream.js`;
      await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
    });

    it('should get exists object stream', async () => {
      const result = await store.getStream(name);
      assert.equal(result.res.status, 200);
      assert(result.stream instanceof Readable);
      const tmpfile = path.join(tmpdir, 'get-stream.js');
      const tmpstream = fs.createWriteStream(tmpfile);

      function finish() {
        return new Promise((resolve) => {
          tmpstream.on('finish', () => {
            resolve();
          });
        });
      }

      result.stream.pipe(tmpstream);
      await finish();
      assert.equal(fs.readFileSync(tmpfile, 'utf8'), fs.readFileSync(__filename, 'utf8'));
    });

    it('should get image stream with image process', async () => {
      const imageName = `${prefix}ali-sdk/oss/nodejs-test-getstream-image-1024x768.png`;
      const originImagePath = path.join(__dirname, 'nodejs-1024x768.png');
      const processedImagePath = path.join(__dirname, 'nodejs-processed-w200.png');
      await store.put(imageName, originImagePath, {
        mime: 'image/png'
      });

      let result = await store.getStream(imageName, { process: 'image/resize,w_200' });
      assert.equal(result.res.status, 200);
      let isEqual = await streamEqual(result.stream, fs.createReadStream(processedImagePath));
      assert(isEqual);
      result = await store.getStream(
        imageName,
        { process: 'image/resize,w_200', subres: { 'x-oss-process': 'image/resize,w_100' } }
      );
      assert.equal(result.res.status, 200);
      isEqual = await streamEqual(result.stream, fs.createReadStream(processedImagePath));
      assert(isEqual);
    });

    it('should throw error when object not exists', async () => {
      try {
        await store.getStream(`${name}not-exists`);
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'NoSuchKeyError');
      }
    });

    it('should throw error and consume the response stream', async () => {
      store.agent = new AgentKeepalive({
        keepAlive: true
      });
      store.httpsAgent = new HttpsAgentKeepalive();
      try {
        await store.getStream(`${name}not-exists`);
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'NoSuchKeyError');
        assert(Object.keys(store.agent.freeSockets).length === 0);
        await sleep(1);
        assert(Object.keys(store.agent.freeSockets).length === 1);
      }
    });
  });

  describe('delete()', () => {
    it('should delete exsits object', async () => {
      const name = `${prefix}ali-sdk/oss/delete.js`;
      await store.put(name, __filename);

      const info = await store.delete(name);
      assert.equal(info.res.status, 204);

      await utils.throws(async () => {
        await store.head(name);
      }, 'NoSuchKeyError');
    });

    it('should delete not exists object', async () => {
      const info = await store.delete('not-exists-name');
      assert.equal(info.res.status, 204);
    });
  });

  describe('deleteMulti()', () => {
    const names = [];
    beforeEach(async () => {
      let name = `${prefix}ali-sdk/oss/deleteMulti0.js`;
      names.push(name);
      await store.put(name, __filename);

      name = `${prefix}ali-sdk/oss/deleteMulti1.js`;
      names.push(name);
      await store.put(name, __filename);

      name = `${prefix}ali-sdk/oss/deleteMulti2.js`;
      names.push(name);
      await store.put(name, __filename);
    });

    it('should delete 3 exists objs', async () => {
      const result = await store.deleteMulti(names);
      assert.deepEqual(result.deleted, names);
      assert.equal(result.res.status, 200);
    });

    it('should delete 2 exists and 2 not exists objs', async () => {
      const result = await store.deleteMulti(names.slice(0, 2).concat(['not-exist1', 'not-exist2']));
      assert.deepEqual(result.deleted, names.slice(0, 2).concat(['not-exist1', 'not-exist2']));
      assert.equal(result.res.status, 200);
    });

    it('should delete 1 exists objs', async () => {
      const result = await store.deleteMulti(names.slice(0, 1));
      assert.deepEqual(result.deleted, names.slice(0, 1));
      assert.equal(result.res.status, 200);
    });

    it('should delete in quiet mode', async () => {
      const result = await store.deleteMulti(names, {
        quiet: true
      });
      assert.equal(result.deleted, null);
      assert.equal(result.res.status, 200);
    });
  });

  describe('copy()', () => {
    let name;
    let resHeaders;
    let otherBucket;
    let otherBucketObject;
    before(async () => {
      name = `${prefix}ali-sdk/oss/copy-meta.js`;
      const object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
      resHeaders = object.res.headers;

      otherBucket = `ali-copy-object-source-bucket-${prefix.replace(/[/.]/g, '-')}`;
      otherBucket = otherBucket.substring(0, otherBucket.length - 1);
      await store.putBucket(otherBucket);
      store.useBucket(otherBucket);
      otherBucketObject = `${prefix}ali-sdk/oss/copy-source.js`;
      await store.put(otherBucketObject, __filename);
      store.useBucket(bucket);
    });

    after(async () => {
      await utils.cleanBucket(store, otherBucket);
      store.useBucket(bucket);
    });

    it('should copy object from same bucket', async () => {
      const originname = `${prefix}ali-sdk/oss/copy-new.js`;
      const result = await store.copy(originname, name);
      assert.equal(result.res.status, 200);
      assert.equal(typeof result.data.etag, 'string');
      assert.equal(typeof result.data.lastModified, 'string');

      const info = await store.head(originname);
      assert.equal(info.meta.uid, '1');
      assert.equal(info.meta.pid, '123');
      assert.equal(info.meta.slus, 'test.html');
      assert.equal(info.status, 200);
    });

    it('should copy object from other bucket, sourceBucket in copySource', async () => {
      const copySource = `/${otherBucket}/${otherBucketObject}`;
      const copyTarget = `${prefix}ali-sdk/oss/copy-target.js`;
      const result = await store.copy(copyTarget, copySource);
      assert.equal(result.res.status, 200);

      const info = await store.head(copyTarget);
      assert.equal(info.status, 200);
    });

    it('should copy object from other bucket, sourceBucket is a separate parameter', async () => {
      const copySource = otherBucketObject;
      const copyTarget = `${prefix}ali-sdk/oss/has-bucket-name-copy-target.js`;
      const result = await store.copy(copyTarget, copySource, otherBucket);
      assert.equal(result.res.status, 200);

      const info = await store.head(copyTarget);
      assert.equal(info.status, 200);
    });

    it('should copy object with non-english name', async () => {
      const sourceName = `${prefix}ali-sdk/oss/copy-meta_测试.js`;
      let result = await store.put(sourceName, __filename, {
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
      assert.equal(info.meta.uid, '2');
      assert.equal(info.meta.pid, '1234');
      assert.equal(info.meta.slus, 'test1.html');
      assert.equal(info.status, 200);
    });

    it('should copy object with non-english name and bucket', async () => {
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
      assert.equal(info.meta.uid, '3');
      assert.equal(info.meta.pid, '12345');
      assert.equal(info.meta.slus, 'test2.html');
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
      assert.equal(info.meta.uid, '2');
      assert(!info.meta.pid);
      assert(!info.meta.slus);
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

    it('should throw NoSuchKeyError when source object not exists', async () => {
      await utils.throws(async () => {
        await store.copy('new-object', 'not-exists-object');
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.message, 'The specified key does not exist.');
        assert.equal(err.status, 404);
      });
    });

    describe('If-Match header', () => {
      it('should throw PreconditionFailedError when If-Match not equal source object etag', async () => {
        await utils.throws(async () => {
          await store.copy('new-name', name, {
            headers: {
              'If-Match': 'foo-bar'
            }
          });
        }, (err) => {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Match)');
          assert.equal(err.status, 412);
        });
      });

      it('should copy object when If-Match equal source object etag', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Match.js`;
        const result = await store.copy(originname, name, {
          headers: {
            'If-Match': resHeaders.etag
          }
        });
        assert.equal(result.res.status, 200);
        assert.equal(typeof result.data.etag, 'string');
        assert.equal(typeof result.data.lastModified, 'string');
      });
    });

    describe('If-None-Match header', () => {
      it('should return 304 when If-None-Match equal source object etag', async () => {
        const result = await store.copy('new-name', name, {
          headers: {
            'If-None-Match': resHeaders.etag
          }
        });
        assert.equal(result.res.status, 304);
        assert.equal(result.data, null);
      });

      it('should copy object when If-None-Match not equal source object etag', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-None-Match.js`;
        const result = await store.copy(originname, name, {
          headers: {
            'If-None-Match': 'foo-bar'
          }
        });
        assert.equal(result.res.status, 200);
        assert.equal(typeof result.data.etag, 'string');
        assert.equal(typeof result.data.lastModified, 'string');
      });
    });

    describe('If-Modified-Since header', () => {
      it('should 304 when If-Modified-Since > source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Modified-Since.js`;
        let nextYear = new Date(resHeaders.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        const result = await store.copy(originname, name, {
          headers: {
            'If-Modified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 304);
      });

      it('should 304 when If-Modified-Since >= source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Modified-Since.js`;
        const result = await store.copy(originname, name, {
          headers: {
            'If-Modified-Since': resHeaders.date
          }
        });
        assert.equal(result.res.status, 304);
      });

      it('should 200 when If-Modified-Since < source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Modified-Since.js`;
        let lastYear = new Date(resHeaders.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        const result = await store.copy(originname, name, {
          headers: {
            'If-Modified-Since': lastYear
          }
        });
        assert.equal(result.res.status, 200);
      });
    });

    describe('If-Unmodified-Since header', () => {
      it('should 200 when If-Unmodified-Since > source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Unmodified-Since.js`;
        let nextYear = new Date(resHeaders.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear = nextYear.toGMTString();
        const result = await store.copy(originname, name, {
          headers: {
            'If-Unmodified-Since': nextYear
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should 200 when If-Unmodified-Since >= source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Unmodified-Since.js`;
        const result = await store.copy(originname, name, {
          headers: {
            'If-Unmodified-Since': resHeaders.date
          }
        });
        assert.equal(result.res.status, 200);
      });

      it('should throw PreconditionFailedError when If-Unmodified-Since < source object modified time', async () => {
        const originname = `${prefix}ali-sdk/oss/copy-new-If-Unmodified-Since.js`;
        let lastYear = new Date(resHeaders.date);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear = lastYear.toGMTString();
        await utils.throws(async () => {
          await store.copy(originname, name, {
            headers: {
              'If-Unmodified-Since': lastYear
            }
          });
        }, (err) => {
          assert.equal(err.name, 'PreconditionFailedError');
          assert.equal(err.message, 'At least one of the pre-conditions you specified did not hold. (condition: If-Unmodified-Since)');
          assert.equal(err.status, 412);
        });
      });
    });
  });

  describe('putMeta()', () => {
    let name;
    before(async () => {
      name = `${prefix}ali-sdk/oss/putMeta.js`;
      const object = await store.put(name, __filename, {
        meta: {
          uid: 1,
          pid: '123',
          slus: 'test.html'
        }
      });
      assert.equal(typeof object.res.headers['x-oss-request-id'], 'string');
    });

    it('should update exists object meta', async () => {
      await store.putMeta(name, {
        uid: '2'
      });
      const info = await store.head(name);
      assert.equal(info.meta.uid, '2');
      assert(!info.meta.pid);
      assert(!info.meta.slus);
    });

    it('should throw NoSuchKeyError when update not exists object meta', async () => {
      await utils.throws(async () => {
        await store.putMeta(`${name}not-exists`, {
          uid: '2'
        });
      }, (err) => {
        assert.equal(err.name, 'NoSuchKeyError');
        assert.equal(err.status, 404);
      });
    });
  });

  describe('list()', () => {
    // oss.jpg
    // fun/test.jpg
    // fun/movie/001.avi
    // fun/movie/007.avi
    let listPrefix;
    before(async () => {
      listPrefix = `${prefix}ali-sdk/list/`;
      await store.put(`${listPrefix}oss.jpg`, Buffer.from('oss.jpg'));
      await store.put(`${listPrefix}fun/test.jpg`, Buffer.from('fun/test.jpg'));
      await store.put(`${listPrefix}fun/movie/001.avi`, Buffer.from('fun/movie/001.avi'));
      await store.put(`${listPrefix}fun/movie/007.avi`, Buffer.from('fun/movie/007.avi'));
      await store.put(`${listPrefix}other/movie/007.avi`, Buffer.from('other/movie/007.avi'));
      await store.put(`${listPrefix}other/movie/008.avi`, Buffer.from('other/movie/008.avi'));
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
      const result = await store.list({
        'max-keys': 1
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list top 3 objects', async () => {
      const result = await store.list({
        'max-keys': 3
      });
      assert.equal(result.objects.length, 3);
      result.objects.map(checkObjectProperties);
      assert.equal(typeof result.nextMarker, 'string');
      assert(result.isTruncated);
      assert.equal(result.prefixes, null);

      // next 2
      const result2 = await store.list({
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
      let result = await store.list({
        prefix: `${listPrefix}fun/movie/`
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);

      result = await store.list({
        prefix: `${listPrefix}fun/movie`
      });
      assert.equal(result.objects.length, 2);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.equal(result.prefixes, null);
    });

    it('should list current dir files only', async () => {
      let result = await store.list({
        prefix: listPrefix,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/`, `${listPrefix}other/`]);

      result = await store.list({
        prefix: `${listPrefix}fun/`,
        delimiter: '/'
      });
      assert.equal(result.objects.length, 1);
      result.objects.map(checkObjectProperties);
      assert.equal(result.nextMarker, null);
      assert(!result.isTruncated);
      assert.deepEqual(result.prefixes, [`${listPrefix}fun/movie/`]);

      result = await store.list({
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

  describe('object key encoding', () => {
    it('should encode variant object keys', async () => {
      const prefixz = 'ali-oss-test-key-';
      const keys = {
        simple: 'simple_key',
        chinese: '杭州・中国',
        space: '是 空格 yeah +-/\\&*#(1) ',
        invisible: '\x01\x0a\x0c\x07\x50\x63',
        xml: 'a<b&c>d +'
      };

      const names = [];
      /* eslint no-restricted-syntax: [0] */
      /* eslint guard-for-in: [0] */
      /* eslint no-await-in-loop: [0] */
      for (const k in keys) {
        const key = prefixz + keys[k];
        let result = await store.put(key, Buffer.from(''));
        assert.equal(result.res.status, 200);

        result = await store.list({
          prefixz
        });
        const objects = result.objects.map(obj => obj.name);
        assert(objects.indexOf(key) >= 0);

        result = await store.head(key);
        assert.equal(result.res.status, 200);

        names.push(keys[k]);
      }

      const result = await store.deleteMulti(names);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.deleted, names);
    });
  });

  describe('putACL(), getACL()', () => {
    it('should put and get object ACL', async () => {
      const name = `${prefix}object/acl`;
      let result = await store.put(name, Buffer.from('hello world'));
      assert.equal(result.res.status, 200);

      result = await store.getACL(name);
      assert.equal(result.res.status, 200);
      assert.equal(result.acl, 'default');

      result = await store.putACL(name, 'public-read');
      assert.equal(result.res.status, 200);

      result = await store.getACL(name);
      assert.equal(result.res.status, 200);
      assert.equal(result.acl, 'public-read');

      result = await store.get(name);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.content, Buffer.from('hello world'));
    });
  });

  describe('append()', () => {
    const name = `/${prefix}ali-sdk/oss/apend${Date.now()}`;
    afterEach(async () => {
      await store.delete(name);
    });

    it('should apend object with content buffer', async () => {
      let object = await store.append(name, Buffer.from('foo'));
      assert(object.res.status === 200);
      assert(object.nextAppendPosition === '3');
      assert(object.res.headers['x-oss-next-append-position'] === '3');

      let res = await urllib.request(store.signatureUrl(name));
      assert(res.data.toString() === 'foo');
      assert(res.headers['x-oss-next-append-position'] === '3');

      object = await store.append(name, Buffer.from('bar'), {
        position: 3
      });
      assert(object.res.status === 200);
      assert(object.nextAppendPosition === '6');
      assert(object.res.headers['x-oss-next-append-position'] === '6');

      res = await urllib.request(store.signatureUrl(name));
      assert(res.data.toString() === 'foobar');
      assert(res.headers['x-oss-next-append-position'] === '6');
    });

    it('should apend object with local file path', async () => {
      const file = path.join(__dirname, 'fixtures/foo.js');
      let object = await store.append(name, file);
      assert(object.nextAppendPosition === '16');

      object = await store.append(name, file, { position: 16 });
      assert(object.nextAppendPosition === '32');
    });

    it('should apend object with readstream', async () => {
      const file = path.join(__dirname, 'fixtures/foo.js');
      let object = await store.append(name, fs.createReadStream(file));
      assert(object.nextAppendPosition === '16');

      object = await store.append(name, fs.createReadStream(file), {
        position: 16
      });
      assert(object.nextAppendPosition === '32');
    });

    it('should error when positio not match', async () => {
      await store.append(name, Buffer.from('foo'));

      try {
        await store.append(name, Buffer.from('foo'));
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'Position is not equal to file length');
        assert(err.name === 'PositionNotEqualToLengthError');
      }
    });

    it('should use nextAppendPosition to append next', async () => {
      let object = await store.append(name, Buffer.from('foo'));
      assert(object.nextAppendPosition === '3');

      object = await store.append(name, Buffer.from('bar'), {
        position: object.nextAppendPosition
      });

      object = await store.append(name, Buffer.from('baz'), {
        position: object.nextAppendPosition
      });

      const res = await urllib.request(store.signatureUrl(name));
      assert(res.data.toString() === 'foobarbaz');
      assert(res.headers['x-oss-next-append-position'] === '9');
    });
  });

  describe('restore()', () => {
    it('Should return OperationNotSupportedError when the type of bucket is not archive', async () => {
      const name = '/oss/restore.js';
      await store.put(name, __filename);

      try {
        await store.restore(name);
        throw new Error('should not run this');
      } catch (err) {
        assert.equal(err.name, 'OperationNotSupportedError');
      }
    });
    it('Should return 202 when restore is called first', async () => {
      store.setBucket(archvieBucket);
      const name = '/oss/restore.js';
      await store.put(name, __filename);

      const info = await store.restore(name);
      assert.equal(info.res.status, 202);

      // in 1 minute verify RestoreAlreadyInProgressError
      try {
        await store.restore(name);
      } catch (err) {
        assert.equal(err.name, 'RestoreAlreadyInProgressError');
      }
    });
  });

  describe('symlink()', () => {
    it('Should put and get Symlink', async () => {
      const targetName = '/oss/target-测试.js';
      const name = '/oss/symlink-软链接.js';
      let result = await store.put(targetName, __filename);
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
      assert.equal(result.targetName, store._objectName(targetName));

      result = await store.head(name);

      assert.equal(result.res.status, 200);
      assert.equal(result.res.headers['x-oss-object-type'], 'Symlink');
      assert.deepEqual(result.meta, {
        uid: '1',
        slus: 'test.html'
      });
      // TODO getObjectMeta should return storage class,
      // headObject return targetObject storage class
      // result = await store.getObjectMeta(name);
      // console.log(result);
    });
  });

  describe('calculatePostSignature()', () => {
    it('should get signature for postObject', async () => {
      const name = 'calculatePostSignature.js';
      const url = store.generateObjectUrl(name).replace(name, '');
      const date = new Date();
      date.setDate(date.getDate() + 1);
      const policy = {
        expiration: date.toISOString(),
        conditions: [
          { bucket: store.options.bucket }
        ]
      };

      const params = store.calculatePostSignature(policy);

      const options = {
        url,
        method: 'POST',
        formData: {
          ...params,
          key: name,
          file: {
            value: 'calculatePostSignature',
            options: {
              filename: name,
              contentType: 'application/x-javascript'
            }
          }
        }
      };

      const postFile = () =>
        new Promise((resolve, reject) => {
          request(options, (err, res) => {
            if (err) reject(err);
            if (res) resolve(res);
          });
        });

      const result = await postFile();
      assert(result.statusCode === 204);
      const headRes = await store.head(name);
      assert.equal(headRes.status, 200);
    });

    it('should throw error when policy is not JSON or Object', async () => {
      let policy = 'string'
      const errorMessage = 'policy must be JSON string or Object'
      try {
        store.calculatePostSignature(policy)
        assert(false)
      } catch (error) {
        assert.strictEqual(errorMessage, error.message)
      }
      try {
        policy = 123
        store.calculatePostSignature(policy)
        assert(false)
      } catch (error) {
        assert.strictEqual(errorMessage, error.message)
      }
    });
  });

  describe('getObjectTagging() putObjectTagging() deleteObjectTagging()', () => {
    const name = '/oss/tagging.js';

    before(async () => {
      await store.put(name, __filename);
    });

    it('should get the tags of object', async () => {
      try {
        const result = await store.getObjectTagging(name);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });

    it('should configures or updates the tags of object', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        result = await store.putObjectTagging(name, tag);
        assert.strictEqual(result.status, 200);

        result = await store.getObjectTagging(name);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }

      try {
        const tag = { a: '1' };
        result = await store.putObjectTagging(name, tag);
        assert.strictEqual(result.status, 200);

        result = await store.getObjectTagging(name);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }
    });

    it('maximum of 10 tags for a object', async () => {
      try {
        const tag = {};
        Array(11).fill(1).forEach((_, index) => {
          tag[index] = index;
        });
        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('maximum of 10 tags for a object', error.message);
      }
    });

    it('tag can contain invalid string', async () => {
      try {
        const errorStr = '错误字符串@#￥%……&*！';
        const key = errorStr;
        const value = errorStr;
        const tag = { [key]: value };

        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('tag can contain letters, numbers, spaces, and the following symbols: plus sign (+), hyphen (-), equal sign (=), period (.), underscore (_), colon (:), and forward slash (/)', error.message);
      }
    });

    it('tag key can be a maximum of 128 bytes in length', async () => {
      try {
        const key = new Array(129).fill('1').join('');
        const tag = { [key]: '1' };

        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('tag key can be a maximum of 128 bytes in length', error.message);
      }
    });

    it('tag value can be a maximum of 256 bytes in length', async () => {
      try {
        const value = new Array(257).fill('1').join('');
        const tag = { a: value };

        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('tag value can be a maximum of 256 bytes in length', error.message);
      }
    });

    it('should throw error when the type of tag is not Object', async () => {
      try {
        const tag = [{ a: 1 }];
        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert(error.message.includes('tag must be Object'));
      }
    });

    it('should throw error when the type of tag value is number', async () => {
      try {
        const tag = { a: 1 };
        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Object', async () => {
      try {
        const tag = { a: { inner: '1' } };
        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Array', async () => {
      try {
        const tag = { a: ['1', '2'] };
        await store.putObjectTagging(name, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should delete the tags of object', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        await store.putObjectTagging(name, tag);

        result = await store.deleteObjectTagging(name);
        assert.strictEqual(result.status, 204);

        result = await store.getObjectTagging(name);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });
  });
});
