'use strict';

const fs = require('fs');
const assert = require('assert');
const utils = require('./utils');
const oss = require('../');
const config = require('./config').oss;
const { md5 } = require('utility');
const mm = require('mm');
const sinon = require('sinon');

describe('test/multipart.test.js', () => {
  const { prefix } = utils;

  before(function* () {
    this.store = oss(config);
    this.bucket = `ali-oss-test-multipart-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.region = config.region;

    yield this.store.putBucket(this.bucket, this.region);
    this.store.useBucket(this.bucket, this.region);
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('listUploads()', () => {
    beforeEach(function* () {
      const result = yield this.store.listUploads({
        'max-uploads': 1000,
      });
      const uploads = result.uploads || [];
      for (let i = 0; i < uploads.length; i++) {
        const up = uploads[i];
        yield this.store.abortMultipartUpload(up.name, up.uploadId);
      }
    });

    it('should list by key marker', function* () {
      const name = `${prefix}multipart/list-key`;
      const ids = [];
      for (let i = 0; i < 5; i++) {
        const result = yield this.store.initMultipartUpload(name + i);
        ids.push(result.uploadId);
      }
      // list all uploads
      let result = yield this.store.listUploads({
        'max-uploads': 10,
      });
      const all = result.uploads.map(up => up.uploadId);
      assert.deepEqual(all, ids);

      // after 1
      result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': name + 0,
      });
      const after1 = result.uploads.map(up => up.uploadId);
      assert.deepEqual(after1, ids.slice(1));

      // after 5
      result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': name + 4,
      });
      const after5 = result.uploads.map(up => up.uploadId);
      assert.deepEqual(after5.length, 0);
    });

    it('should list by id marker', function* () {
      const name = `${prefix}multipart/list-id`;
      const ids = [];
      for (let i = 0; i < 5; i++) {
        const result = yield this.store.initMultipartUpload(name);
        ids.push(result.uploadId);
      }
      ids.sort();

      // list all uploads
      let result = yield this.store.listUploads({
        'max-uploads': 10,
      });
      const all = result.uploads.map(up => up.uploadId);
      assert.deepEqual(all, ids);

      // after 1: upload id marker alone is ignored
      result = yield this.store.listUploads({
        'max-uploads': 10,
        'upload-id-marker': ids[1],
      });
      const after1 = result.uploads.map(up => up.uploadId);
      assert.deepEqual(after1, ids);

      // after 5: upload id marker alone is ignored
      result = yield this.store.listUploads({
        'max-uploads': 10,
        'upload-id-marker': ids[4],
      });
      const after5 = result.uploads.map(up => up.uploadId);
      assert.deepEqual(after5, ids);
    });

    it('should list by id & key marker', function* () {
      const fooName = `${prefix}multipart/list-foo`;
      const fooIds = [];
      for (let i = 0; i < 5; i++) {
        const result = yield this.store.initMultipartUpload(fooName);
        fooIds.push(result.uploadId);
      }
      fooIds.sort();

      const barName = `${prefix}multipart/list-bar`;
      const barIds = [];
      for (let i = 0; i < 5; i++) {
        const result = yield this.store.initMultipartUpload(barName);
        barIds.push(result.uploadId);
      }
      barIds.sort();

      // after 1
      let result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': barName,
        'upload-id-marker': barIds[0],
      });
      const after1 = result.uploads.map(up => up.uploadId);
      after1.sort();
      const should = barIds.slice(1).concat(fooIds).sort();
      assert.deepEqual(after1, should);

      // after 5
      result = yield this.store.listUploads({
        'max-uploads': 10,
        'key-marker': barName,
        'upload-id-marker': barIds[4],
      });
      const after5 = result.uploads.map(up => up.uploadId);
      assert.deepEqual(after5, fooIds);
    });
  });

  describe('multipartUpload()', () => {
    afterEach(mm.restore);

    it('should initMultipartUpload with x-oss-server-side-encryption', function* () {
      const name = 'multipart-x-oss-server-side-encryption';
      const result = yield this.store.initMultipartUpload(name, {
        headers: {
          'x-oss-server-side-encryption': 'AES256',
        },
      });

      assert.equal(result.res.headers['x-oss-server-side-encryption'], 'AES256');
    });

    it('should fallback to putStream when file size is smaller than 100KB', function* () {
      const fileName = yield utils.createTempFile('multipart-fallback', (100 * 1024) - 1);
      const name = `${prefix}multipart/fallback`;
      let progress = 0;

      const putStreamSpy = sinon.spy(this.store, 'putStream');
      const uploadPartSpy = sinon.spy(this.store, '_uploadPart');

      const result = yield this.store.multipartUpload(name, fileName, {
        progress() {
          progress++;
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(putStreamSpy.callCount, 1);
      assert.equal(uploadPartSpy.callCount, 0);
      assert.equal(progress, 1);

      assert.equal(typeof result.bucket, 'string');
      assert.equal(typeof result.etag, 'string');

      this.store.putStream.restore();
      this.store._uploadPart.restore();
    });

    /* eslint require-yield: [0] */
    it('should use default partSize when not specified', function* () {
      const partSize = this.store._getPartSize(1024 * 1024, null);
      assert.equal(partSize, 1 * 1024 * 1024);
    });

    it('should use user specified partSize', function* () {
      const partSize = this.store._getPartSize(1024 * 1024, 200 * 1024);
      assert.equal(partSize, 200 * 1024);
    });

    it('should not exceeds max part number', function* () {
      const fileSize = 10 * 1024 * 1024 * 1024;
      const maxNumParts = 10 * 1000;

      const partSize = this.store._getPartSize(fileSize, 100 * 1024);
      assert.equal(partSize, Math.ceil(fileSize / maxNumParts));
    });

    it('should upload file using multipart upload', function* () {
      // create a file with 1M random data
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      const name = `${prefix}multipart/upload-file`;
      let progress = 0;
      const result = yield this.store.multipartUpload(name, fileName, {
        partSize: 100 * 1024,
        progress() {
          progress++;
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(progress, 12);

      const object = yield this.store.get(name);
      assert.equal(object.res.status, 200);
      const fileBuf = fs.readFileSync(fileName);
      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));
    });

    it('should upload file using multipart upload with exception', function* () {
      // create a file with 1M random data
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      const name = `${prefix}multipart/upload-file-exception`;
      const clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);

      const stubUploadPart = sinon.stub(clientTmp, '_uploadPart');
      stubUploadPart.throws('TestUploadPartException');


      let errorMsg;
      let errPartNum;
      try {
        yield clientTmp.multipartUpload(name, fileName);
      } catch (err) {
        errorMsg = err.message;
        errPartNum = err.partNum;
      }
      assert.equal(
        errorMsg,
        'Failed to upload some parts with error: TestUploadPartException part_num: 0',
      );
      assert.equal(errPartNum, 0);
      clientTmp._uploadPart.restore();
    });

    it('should upload web file using multipart upload', function* () {
      const File = function (name, content) {
        this.name = name;
        this.buffer = content;
        this.size = this.buffer.length;

        this.slice = function (start, end) {
          return new File(this.name, this.buffer.slice(start, end));
        };
      };
      /* eslint global-require: [0] */
      const FileReader = require('filereader');

      mm(global, 'File', File);
      mm(global, 'FileReader', FileReader);

      // create a file with 1M random data
      const fileName = yield utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
      const fileBuf = fs.readFileSync(fileName);
      const webFile = new File(fileName, fileBuf);

      const name = `${prefix}multipart/upload-webfile`;
      const result = yield this.store.multipartUpload(name, webFile, {
        partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);

      const object = yield this.store.get(name);
      assert.equal(object.res.status, 200);

      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));

      mm.restore();
    });

    it('should upload web file using multipart upload in IE10', function* () {
      const File = function (name, content) {
        this.name = name;
        this.buffer = content;
        this.size = this.buffer.length;

        this.slice = function (start, end) {
          return new File(this.name, this.buffer.slice(start, end));
        };
      };
      const FileReader = require('filereader');

      mm(global, 'File', File);
      mm(global, 'FileReader', FileReader);

      // create a file with 1M random data
      const fileName = yield utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
      const fileBuf = fs.readFileSync(fileName);
      const webFile = new File(fileName, fileBuf);
      const name = `${prefix}multipart/upload-webfile-ie10`;
      const clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);
      sinon.stub(clientTmp, 'checkBrowserAndVersion', (browser, version) => (browser === 'Internet Explorer' && version === '10'));
      const result = yield clientTmp.multipartUpload(name, webFile, {
        partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);

      const object = yield clientTmp.get(name);
      assert.equal(object.res.status, 200);

      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));

      mm.restore();
    });

    it('should resume upload using checkpoint', function* () {
      const uploadPart = this.store._uploadPart;
      mm(this.store, '_uploadPart', function* (name, uploadId, partNo, data) {
        if (partNo === 5) {
          throw new Error('mock upload part fail.');
        } else {
          return uploadPart.call(this, name, uploadId, partNo, data);
        }
      });

      // create a file with 1M random data
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);

      const name = `${prefix}multipart/upload-file`;
      const cptFile = '/tmp/.oss/cpt.json';
      let progress = 0;
      try {
        yield this.store.multipartUpload(name, fileName, {
          partSize: 100 * 1024,
          progress(percent, cpt) {
            progress++;
            fs.writeFileSync(cptFile, JSON.stringify(cpt));
          },
        });
        // should not succeed
        assert(false);
      } catch (err) {
        // pass
      }

      mm.restore();
      const result = yield this.store.multipartUpload(name, fileName, {
        checkpoint: JSON.parse(fs.readFileSync(cptFile)),
        progress() {
          progress++;
        },
      });
      assert.equal(result.res.status, 200);
      assert.equal(progress, 12);

      const object = yield this.store.get(name);
      assert.equal(object.res.status, 200);
      const fileBuf = fs.readFileSync(fileName);
      assert.equal(object.content.length, fileBuf.length);
      // avoid comparing buffers directly for it may hang when generating diffs
      assert.deepEqual(md5(object.content), md5(fileBuf));
    });

    it('should return requestId in init, upload part, complete', function* () {
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);// 1m
      const name = `${prefix}multipart/upload-file`;

      const result = yield this.store.multipartUpload(name, fileName, {
        progress(p, checkpoint, res) {
          assert.equal(true, res && Object.keys(res).length !== 0);
        },
      });
      assert.equal(true, result.res && Object.keys(result.res).length !== 0);
      assert.equal(result.res.status, 200);
    });

    it('should upload with uploadPart', function* () {
      const fileName = yield utils.createTempFile('upload-with-upload-part', 10 * 100 * 1024);

      const name = `${prefix}multipart/upload-with-upload-part`;

      const init = yield this.store.initMultipartUpload(name);
      const { uploadId } = init;
      const partSize = 100 * 1024;
      const dones = [];
      for (let i = 1; i <= 10; i++) {
        const start = (i - 1) * partSize;
        const end = Math.min(i * partSize, 10 * 100 * 1024);
        const part = yield this.store.uploadPart(name, uploadId, i, fileName, start, end);
        dones.push({
          number: i,
          etag: part.etag,
        });
      }

      const result = yield this.store.completeMultipartUpload(name, uploadId, dones);
      assert.equal(result.res.status, 200);
    });

    it('should upload with list part', function* () {
      const fileName = yield utils.createTempFile('multipart-upload-list-part', 2 * 1024 * 1024);
      const name = `${prefix}multipart/upload-list-part`;
      yield this.store.multipartUpload(name, fileName);
      const client = this.store;
      const copyName = `${prefix}multipart/upload-list-part-copy`;
      let uploadIdz = null;
      try {
        yield client.multipartUploadCopy(copyName, {
          sourceKey: name,
          sourceBucketName: this.bucket,
        }, {
          parallel: 1,
          partSize: 100 * 1024,
          progress(p, checkpoint) {
            return function (done) {
              if (p === 0) {
                uploadIdz = checkpoint.uploadId;
              }
              if (p > 0.5) {
                client.cancel();
              }
              done();
            };
          },
        });
      } catch (err) {
        /* eslint no-empty: [0] */
      }

      const result = yield this.store.listParts(copyName, uploadIdz, {
        'max-parts': 1000,
      }, {});

      assert.equal(result.res.status, 200);
    });
  });

  describe('requestError()', () => {
    it('should request timeout exception', function* () {
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);// 1m
      const name = `${prefix}multipart/upload-file`;

      const stubNetError = sinon.stub(this.store.urllib, 'request');
      const netErr = new Error('TestTimeoutErrorException');
      netErr.status = -2;
      netErr.code = 'ConnectionTimeoutError';
      netErr.name = 'ConnectionTimeoutError';
      stubNetError.throws(netErr);
      let timeoutErr;
      try {
        yield this.store.multipartUpload(name, fileName);
      } catch (err) {
        timeoutErr = err;
      }

      assert.equal(true, timeoutErr && Object.keys(timeoutErr).length !== 0);
      assert.equal(timeoutErr.status, -2);
      this.store.urllib.request.restore();
    });

    it('should request net exception', function* () {
      const fileName = yield utils.createTempFile('multipart-upload-file', 1024 * 1024);// 1m
      const name = `${prefix}multipart/upload-file`;

      const stubNetError = sinon.stub(this.store.urllib, 'request');
      const netErr = new Error('TestNetErrorException');
      netErr.status = -1;
      netErr.code = 'RequestError';
      netErr.name = 'RequestError';
      stubNetError.throws(netErr);

      let netErrs;
      try {
        yield this.store.multipartUpload(name, fileName);
      } catch (err) {
        netErrs = err;
      }

      assert.equal(true, netErr && Object.keys(netErrs).length !== 0);
      assert.equal(netErrs.status, -1);

      this.store.urllib.request.restore();
    });
  });

  describe('multipartCopy()', () => {
    let fileName;
    let name;
    before(function* () {
      fileName = yield utils.createTempFile('multipart-upload-file-copy', 2 * 1024 * 1024);
      name = `${prefix}multipart/upload-file-with-copy`;
      yield this.store.multipartUpload(name, fileName);
    });

    it('should multipart copy copy size err', function* () {
      const file = yield utils.createTempFile('multipart-upload-file', 50 * 1024);
      const objectKey = `${prefix}multipart/upload-file-with-copy-small`;
      yield this.store.multipartUpload(objectKey, file);
      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-small-new`;
      let copyErr = null;
      try {
        yield client.multipartUploadCopy(copyName, {
          sourceKey: objectKey,
          sourceBucketName: this.bucket,
        });
      } catch (err) {
        copyErr = err;
      }

      assert.equal(copyErr.message, 'copySize must not be smaller than 102400');
    });

    it('should multipart copy part size err', function* () {
      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-new`;
      let partSizeErr = null;
      try {
        yield client.multipartUploadCopy(copyName, {
          sourceKey: name,
          sourceBucketName: this.bucket,
        }, {
          partSize: 50 * 1024,
        });
      } catch (err) {
        partSizeErr = err;
      }

      assert.equal(partSizeErr.message, 'partSize must not be smaller than 102400');
    });

    it('should copy with upload part copy', function* () {
      const client = this.store;

      // create a file with 1M random data
      const fileNamez = yield utils.createTempFile('multipart-upload-file-temp-copy', 10 * 100 * 1024);

      const key = `${prefix}multipart/upload-file-temp-copy`;
      yield client.multipartUpload(key, fileNamez);

      const copyName = `${prefix}multipart/upload-file-with-copy-new`;
      const sourceData = {
        sourceKey: name,
        sourceBucketName: this.bucket,
      };
      const objectMeta = yield client._getObjectMeta(sourceData.sourceBucketName, sourceData.sourceKey, {});
      const fileSize = objectMeta.res.headers['content-length'];

      const result = yield client.initMultipartUpload(copyName);

      const partSize = 100 * 1024;// 100kb
      const dones = [];
      // if file part is 10
      for (let i = 1; i <= 10; i++) {
        const start = partSize * (i - 1);
        const end = Math.min(start + partSize, fileSize);
        const range = `${start}-${end - 1}`;
        const part = yield client.uploadPartCopy(copyName, result.uploadId, i, range, sourceData, {});
        dones.push({
          number: i,
          etag: part.res.headers.etag,
        });
      }

      const complete = yield client.completeMultipartUpload(copyName, result.uploadId, dones);

      assert.equal(complete.res.status, 200);
    });


    it('should copy with multipart upload copy', function* () {
      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-new`;
      const result = yield client.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket,
      }, {
        partSize: 256 * 1024,
      });

      assert.equal(result.res.status, 200);
    });

    it('should multipart upload copy in IE10', function* () {
      const copyName = `${prefix}multipart/upload-copy-in-ie10`;
      const clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);
      const checkBrowserAndVersion = sinon.stub(clientTmp, 'checkBrowserAndVersion', (browser, version) => (browser === 'Internet Explorer' && version === '10'));
      const result = yield clientTmp.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket,
      }, {
        partSize: 100 * 1024,
      });
      assert.equal(result.res.status, 200);
      checkBrowserAndVersion.restore();
    });

    it('should multipart upload copy with parallel = 1', function* () {
      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-parallel-1`;
      const result = yield client.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket,
      }, {
        partSize: 256 * 1024,
        parallel: 1,
      });

      assert.equal(result.res.status, 200);
    });

    it('should multipart copy with cancel and resume', function* () {
      const client = this.store;
      const copyName = `${prefix}multipart/upload-file-with-copy-cancel`;
      let tempCheckpoint = null;
      try {
        yield client.multipartUploadCopy(copyName, {
          sourceKey: name,
          sourceBucketName: this.bucket,
        }, {
          partSize: 100 * 1024,
          progress(p, checkpoint) {
            return function (done) {
              tempCheckpoint = checkpoint;
              if (p > 0.5) {
                client.cancel();
              }
              done();
            };
          },
        });
      } catch (err) {
        assert.equal(client.isCancel(), true);
      }

      const result = yield client.multipartUploadCopy(copyName, {
        sourceKey: name,
        sourceBucketName: this.bucket,
      }, {
        partSize: 100 * 1024,
        checkpoint: tempCheckpoint,
        progress(p) {
          return function (done) {
            assert.equal(p > 0.5, true);
            done();
          };
        },
      });

      assert.equal(result.res.status, 200);
    });

    it('should multipart copy with exception', function* () {
      const copyName = `${prefix}multipart/upload-file-with-copy-exception`;
      const clientTmp = oss(config);
      clientTmp.useBucket(this.bucket, this.region);
      /* eslint no-unused-vars: [0] */
      const stubUploadPart = sinon.stub(clientTmp, 'uploadPartCopy', function* (objectKey, uploadId, partNo, range, sourceData, options) {
        if (partNo === 1) {
          throw new Error('TestErrorException');
        }
      });

      let errorMsg;
      let errPartNum;
      try {
        yield clientTmp.multipartUploadCopy(copyName, {
          sourceKey: name,
          sourceBucketName: this.bucket,
        });
      } catch (err) {
        errorMsg = err.message;
        errPartNum = err.partNum;
      }
      assert.equal(
        errorMsg,
        'Failed to copy some parts with error: Error: TestErrorException part_num: 1',
      );
      assert.equal(errPartNum, 1);
      stubUploadPart.restore();
    });
  });
});
