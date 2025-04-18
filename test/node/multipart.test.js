const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const { oss: config, conditions } = require('../config');
const { md5 } = require('utility');
const mm = require('mm');
const sinon = require('sinon');

const tmpdir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpdir)) {
  fs.mkdirSync(tmpdir);
}

const createFile = async (name, size) => {
  size = size || 200 * 1024;
  await new Promise((resolve, reject) => {
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
  });
  return name;
};

describe('test/multipart.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  const bucketRegion = config.region;
  conditions.forEach((moreConfigs, index) => {
    describe(`test multipart in iterate ${index}`, () => {
      before(async () => {
        store = oss({ ...config, ...moreConfigs });
        bucket = `ali-oss-test-multipart-bucket-${prefix.replace(/[/.]/g, '-')}${index}`;

        await store.putBucket(bucket, bucketRegion);
        store.useBucket(bucket, bucketRegion);
      });

      after(async () => {
        await utils.cleanBucket(store, bucket);
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

          // after 5
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
                .map(() => store.initMultipartUpload(name))
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

        it('should list by id & key marker', async () => {
          const fooName = `${prefix}multipart/list-foo`;
          const fooIds = (
            await Promise.all(
              Array(5)
                .fill(1)
                .map(() => store.initMultipartUpload(fooName))
            )
          )
            .map(_ => _.uploadId)
            .sort();

          const barName = `${prefix}multipart/list-bar`;
          const barIds = (
            await Promise.all(
              Array(5)
                .fill(5)
                .map(() => store.initMultipartUpload(barName))
            )
          )
            .map(_ => _.uploadId)
            .sort();

          // after 1
          let result = await store.listUploads({
            'max-uploads': 10,
            'key-marker': barName,
            'upload-id-marker': barIds[0]
          });
          const after1 = result.uploads.map(up => up.uploadId);
          after1.sort();
          const sort1 = barIds.slice(1).concat(fooIds).sort();
          assert.deepEqual(after1, sort1);

          // after 5
          result = await store.listUploads({
            'max-uploads': 10,
            'key-marker': barName,
            'upload-id-marker': barIds[4]
          });
          const after5 = result.uploads.map(up => up.uploadId);
          assert.deepEqual(after5, fooIds);
        });
      });

      describe('multipartUpload()', () => {
        afterEach(mm.restore);

        it('should initMultipartUpload with x-oss-server-side-encryption', async () => {
          const name = 'multipart-x-oss-server-side-encryption';
          const result = await store.initMultipartUpload(name, {
            headers: {
              'x-oss-server-side-encryption': 'AES256'
            }
          });

          assert.equal(result.res.headers['x-oss-server-side-encryption'], 'AES256');
        });

        it('should multipartUpload with x-oss-server-side-encryption', async () => {
          if (store.options.cloudBoxId) return;
          const name = 'multipart-x-oss-server-side-encryption';
          const fileName = await utils.createTempFile('multipart-fallback', 1003 * 1020);
          const result = await store.multipartUpload(name, fileName, {
            headers: {
              'x-oss-server-side-encryption': 'KMS'
            }
          });
          assert.equal(result.res.headers['x-oss-server-side-encryption'], 'KMS');
        });

        it('should fallback to putStream when file size is smaller than 100KB', async () => {
          const fileName = await utils.createTempFile('multipart-fallback', 100 * 1024 - 1);
          const name = `${prefix}multipart/fallback`;
          let progress = 0;

          const putStreamSpy = sinon.spy(store, 'putStream');
          const uploadPartSpy = sinon.spy(store, '_uploadPart');

          const result = await store.multipartUpload(name, fileName, {
            progress() {
              progress++;
            }
          });
          assert.equal(result.res.status, 200);
          assert.equal(putStreamSpy.callCount, 1);
          assert.equal(uploadPartSpy.callCount, 0);
          assert.equal(progress, 1);

          assert.equal(typeof result.bucket, 'string');
          assert.equal(typeof result.etag, 'string');

          store.putStream.restore();
          store._uploadPart.restore();
        });

        /* eslint require-yield: [0] */
        it('should use default partSize when not specified', () => {
          const partSize = store._getPartSize(1024 * 1024, null);
          assert.equal(partSize, 1 * 1024 * 1024);
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
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024);

          const name = `${prefix}multipart/upload-file`;
          let progress = 0;
          const result = await store.multipartUpload(name, fileName, {
            partSize: 100 * 1024,
            progress() {
              progress++;
            }
          });
          assert.equal(result.res.status, 200);
          assert.equal(progress, 13);

          const object = await store.get(name);
          assert.equal(object.res.status, 200);
          const fileBuf = fs.readFileSync(fileName);
          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));
        });

        it('should upload file using multipart upload with exception', async () => {
          // create a file with 1M random data
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024);

          const name = `${prefix}multipart/upload-file-exception`;
          const clientTmp = oss({ ...config, ...moreConfigs });
          clientTmp.useBucket(bucket, bucketRegion);

          const stubUploadPart = sinon.stub(clientTmp, '_uploadPart');
          stubUploadPart.throws('TestUploadPartException');

          let errorMsg;
          let errPartNum;
          try {
            await clientTmp.multipartUpload(name, fileName);
          } catch (err) {
            errorMsg = err.message;
            errPartNum = err.partNum;
          }
          assert.equal(errorMsg, 'Failed to upload some parts with error: TestUploadPartException part_num: 1');
          assert.equal(errPartNum, 1);
          clientTmp._uploadPart.restore();
        });

        it('should upload Node.js Buffer using multipart upload', async () => {
          // create a buffer with 1M random data
          const fileName = await utils.createTempFile('multipart-upload-buffer', 1024 * 1024);
          const fileBuf = fs.readFileSync(fileName);

          const name = `${prefix}multipart/upload-buffer`;
          const result = await store.multipartUpload(name, fileBuf, {
            partSize: 100 * 1024
          });

          assert.equal(result.res.status, 200);

          const object = await store.get(name);
          assert.equal(object.res.status, 200);

          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));
        });

        it('should resume Node.js Buffer upload using checkpoint', async () => {
          const uploadPart = store._uploadPart;
          mm(store, '_uploadPart', function* (name, uploadId, partNo, data) {
            if (partNo === 5) {
              throw new Error('mock upload part fail.');
            } else {
              return uploadPart.call(this, name, uploadId, partNo, data);
            }
          });

          // create a file with 1M random data
          const fileName = await utils.createTempFile('multipart-upload-buffer', 1024 * 1024);
          const fileBuf = fs.readFileSync(fileName);

          const name = `${prefix}multipart/upload-buffer`;
          let lastCpt = {};
          let progress = 0;
          try {
            await store.multipartUpload(name, fileBuf, {
              partSize: 100 * 1024,
              progress(percent, cpt) {
                progress++;
                lastCpt = cpt;
              }
            });
            // should not succeed
            assert(false);
          } catch (err) {
            // pass
          }

          mm.restore();
          const result = await store.multipartUpload(name, fileBuf, {
            checkpoint: lastCpt,
            progress() {
              progress++;
            }
          });
          assert.equal(result.res.status, 200);
          assert.equal(progress, 13);

          const object = await store.get(name);
          assert.equal(object.res.status, 200);
          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));
        });

        it('should upload web file using multipart upload', async () => {
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
          const fileName = await utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
          const fileBuf = fs.readFileSync(fileName);
          const webFile = new File(fileName, fileBuf);

          const name = `${prefix}multipart/upload-webfile`;
          const result = await store.multipartUpload(name, webFile, {
            partSize: 100 * 1024
          });
          assert.equal(result.res.status, 200);

          const object = await store.get(name);
          assert.equal(object.res.status, 200);

          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));

          mm.restore();
        });

        it('should upload web file using multipart upload in IE10', async () => {
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
          const fileName = await utils.createTempFile('multipart-upload-webfile', 1024 * 1024);
          const fileBuf = fs.readFileSync(fileName);
          const webFile = new File(fileName, fileBuf);
          const name = `${prefix}multipart/upload-webfile-ie10`;
          const clientTmp = oss({ ...config, ...moreConfigs });
          clientTmp.useBucket(bucket, bucketRegion);
          sinon
            .stub(clientTmp, 'checkBrowserAndVersion')
            .callsFake((browser, version) => browser === 'Internet Explorer' && version === '10');
          const result = await clientTmp.multipartUpload(name, webFile, {
            partSize: 100 * 1024
          });
          assert.equal(result.res.status, 200);

          const object = await clientTmp.get(name);
          assert.equal(object.res.status, 200);

          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));

          mm.restore();
        });

        it('should resume upload using checkpoint', async () => {
          const uploadPart = store._uploadPart;
          mm(store, '_uploadPart', function* (name, uploadId, partNo, data) {
            if (partNo === 5) {
              throw new Error('mock upload part fail.');
            } else {
              return uploadPart.call(this, name, uploadId, partNo, data);
            }
          });

          // create a file with 1M random data
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024);

          const name = `${prefix}multipart/upload-file`;
          const cptFile = '/tmp/.oss/cpt.json';
          let progress = 0;
          try {
            await store.multipartUpload(name, fileName, {
              partSize: 100 * 1024,
              progress(percent, cpt) {
                progress++;
                fs.writeFileSync(cptFile, JSON.stringify(cpt));
              }
            });
            // should not succeed
            assert(false);
          } catch (err) {
            // pass
          }

          mm.restore();
          const result = await store.multipartUpload(name, fileName, {
            checkpoint: JSON.parse(fs.readFileSync(cptFile)),
            progress() {
              progress++;
            }
          });
          assert.equal(result.res.status, 200);
          assert.equal(progress, 13);

          const object = await store.get(name);
          assert.equal(object.res.status, 200);
          const fileBuf = fs.readFileSync(fileName);
          assert.equal(object.content.length, fileBuf.length);
          // avoid comparing buffers directly for it may hang when generating diffs
          assert.deepEqual(md5(object.content), md5(fileBuf));
        });

        it('should return requestId in init, upload part, complete', async () => {
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024); // 1m
          const name = `${prefix}multipart/upload-file`;

          const result = await store.multipartUpload(name, fileName, {
            progress(p, checkpoint, res) {
              assert.equal(true, res && Object.keys(res).length !== 0);
            }
          });
          assert.equal(true, result.res && Object.keys(result.res).length !== 0);
          assert.equal(result.res.status, 200);
        });

        it('should upload with uploadPart', async () => {
          const fileName = await utils.createTempFile('upload-with-upload-part', 10 * 100 * 1024);

          const name = `${prefix}multipart/upload-with-upload-part`;

          const init = await store.initMultipartUpload(name);
          const { uploadId } = init;
          const partSize = 100 * 1024;
          const list = Array(10)
            .fill(1)
            .map((v, i) => {
              return store.uploadPart(
                name,
                uploadId,
                i + 1,
                fileName,
                i * partSize,
                Math.min((i + 1) * partSize, 10 * 100 * 1024)
              );
            });
          const parts = await Promise.all(list);
          const dones = parts.map((_, i) => ({
            number: i + 1,
            etag: _.etag
          }));

          const result = await store.completeMultipartUpload(name, uploadId, dones);
          assert.equal(result.res.status, 200);
        });

        it('should upload partSize be int number and greater then minPartSize', async () => {
          // create a file with 1M random data
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024);

          const name = `${prefix}multipart/upload-file`;
          let progress = 0;
          try {
            await store.multipartUpload(name, fileName, {
              partSize: 14.56,
              progress() {
                progress++;
              }
            });
          } catch (e) {
            assert.equal('partSize must be int number', e.message);
          }

          try {
            await store.multipartUpload(name, fileName, {
              partSize: 1,
              progress() {
                progress++;
              }
            });
          } catch (e) {
            assert.ok(e.message.startsWith('partSize must not be smaller'));
          }
          assert.equal(progress, 0);
        });

        it('should skip doneParts when re-upload mutilpart files', async () => {
          const PART_SIZE = 1024 * 100;
          const FILE_SIZE = 1024 * 500;
          const SUSPENSION_LIMIT = 3;
          const object = `multipart-${Date.now()}`;
          const fileName = await utils.createTempFile(object, FILE_SIZE);
          const uploadPart = store._uploadPart;
          let checkpoint;
          mm(store, '_uploadPart', function (name, uploadId, partNo, data) {
            if (partNo === SUSPENSION_LIMIT) {
              throw new Error('mock upload part fail.');
            } else {
              return uploadPart.call(this, name, uploadId, partNo, data);
            }
          });
          try {
            await store.multipartUpload(object, fileName, {
              parallel: 1,
              partSize: PART_SIZE,
              progress: (percentage, c) => {
                checkpoint = c;
              }
            });
          } catch (e) {
            assert.strictEqual(checkpoint.doneParts.length, SUSPENSION_LIMIT - 1);
          }
          mm.restore();
          const uploadPartSpy = sinon.spy(store, '_uploadPart');
          await store.multipartUpload(object, fileName, {
            parallel: 1,
            partSize: PART_SIZE,
            checkpoint
          });
          assert.strictEqual(uploadPartSpy.callCount, FILE_SIZE / PART_SIZE - SUSPENSION_LIMIT + 1);
          store._uploadPart.restore();
        });
      });

      describe('requestError()', () => {
        it('should request timeout exception', async () => {
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024); // 1m
          const name = `${prefix}multipart/upload-file`;

          const stubNetError = sinon.stub(store.urllib, 'request');
          const netErr = new Error('TestTimeoutErrorException');
          netErr.status = -2;
          netErr.code = 'ConnectionTimeoutError';
          netErr.name = 'ConnectionTimeoutError';
          stubNetError.throws(netErr);
          let timeoutErr;
          try {
            await store.multipartUpload(name, fileName);
          } catch (err) {
            timeoutErr = err;
          }

          assert.equal(true, timeoutErr && Object.keys(timeoutErr).length !== 0);
          assert.equal(timeoutErr.status, -2);
          store.urllib.request.restore();
        });

        it('should request net exception', async () => {
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024); // 1m
          const name = `${prefix}multipart/upload-file`;

          const stubNetError = sinon.stub(store.urllib, 'request');
          const netErr = new Error('TestNetErrorException');
          netErr.status = -1;
          netErr.code = 'RequestError';
          netErr.name = 'RequestError';
          stubNetError.throws(netErr);

          let netErrs;
          try {
            await store.multipartUpload(name, fileName);
          } catch (err) {
            netErrs = err;
          }

          assert.equal(true, netErr && Object.keys(netErrs).length !== 0);
          assert.equal(netErrs.status, -1);
          store.urllib.request.restore();
        });

        it('should request throw ResponseTimeoutError', async () => {
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024); // 1m
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

        it('should request throw abort event', async () => {
          const fileName = await utils.createTempFile('multipart-upload-file', 1024 * 1024); // 1m
          const name = `${prefix}multipart/upload-file`;
          const stubNetError = sinon.stub(store, '_uploadPart');
          const netErr = new Error('Not Found');
          netErr.status = 404;
          netErr.code = 'Not Found';
          netErr.name = 'Not Found';
          stubNetError.throws(netErr);
          let netErrs;
          try {
            await store.multipartUpload(name, fileName);
          } catch (err) {
            netErrs = err;
          }
          assert.strictEqual(netErrs.status, 0);
          assert.strictEqual(netErrs.name, 'abort');
          store._uploadPart.restore();
        });

        it('should normal processing of non-OSS errors', async () => {
          const stubNetError = sinon.stub(store.urllib, 'request');
          const netErr = new Error('TestNonOSSErrorException');
          netErr.status = 400;
          netErr.code = 'TestNonOSSError';
          stubNetError.throws(netErr);
          let nonOSSErr;
          try {
            await store.head('test.txt');
            assert.fail('Expect to throw an error.');
          } catch (err) {
            nonOSSErr = err;
          }

          assert.strictEqual(nonOSSErr.message, `Unknow error, status: ${netErr.status}`);
          assert.strictEqual(nonOSSErr.name, 'UnknownError');
          assert.strictEqual(nonOSSErr.status, netErr.status);
          stubNetError.restore();

          nonOSSErr = undefined;
          const stubNetError2 = sinon.stub(store.urllib, 'request');
          const netErr2 = new Error('TestNonOSSErrorException');
          netErr2.status = 400;
          netErr2.data = 'TestNonOSSError';
          stubNetError2.throws(netErr2);
          try {
            await store.listBuckets();
            assert.fail('Expect to throw an error.');
          } catch (err) {
            nonOSSErr = err;
          }

          assert(nonOSSErr.message.includes(`\nraw xml: ${netErr2.data}`));
          assert.strictEqual(nonOSSErr.status, netErr2.status);
          stubNetError2.restore();
        });
      });

      describe('multipartCopy()', () => {
        let fileName;
        let name;
        before(async () => {
          fileName = await utils.createTempFile('multipart-upload-file-copy', 2 * 1024 * 1024);
          name = `${prefix}multipart/upload-file-with-copy`;
          await store.multipartUpload(name, fileName);
        });

        it('should multipart copy copy size err', async () => {
          const file = await utils.createTempFile('multipart-upload-file', 50 * 1024);
          const objectKey = `${prefix}multipart/upload-file-with-copy-small`;
          await store.multipartUpload(objectKey, file);
          const client = store;
          const copyName = `${prefix}multipart/upload-file-with-copy-small-new`;
          let copyErr = null;
          try {
            await client.multipartUploadCopy(copyName, {
              sourceKey: objectKey,
              sourceBucketName: bucket
            });
          } catch (err) {
            copyErr = err;
          }

          assert.equal(copyErr.message, 'copySize must not be smaller than 102400');
        });

        it('should multipart copy part size err', async () => {
          const client = store;
          const copyName = `${prefix}multipart/upload-file-with-copy-new`;
          let partSizeErr = null;
          try {
            await client.multipartUploadCopy(
              copyName,
              {
                sourceKey: name,
                sourceBucketName: bucket
              },
              {
                partSize: 50 * 1024
              }
            );
          } catch (err) {
            partSizeErr = err;
          }

          assert.equal(partSizeErr.message, 'partSize must not be smaller than 102400');
        });

        it('should copy with upload part copy', async () => {
          const client = store;

          // create a file with 1M random data
          const fileNamez = await utils.createTempFile('multipart-upload-file-temp-copy', 10 * 100 * 1024);

          const key = `${prefix}multipart/upload-file-temp-copy`;
          await client.multipartUpload(key, fileNamez);

          const copyName = `${prefix}multipart/upload-file-with-copy-new`;
          const sourceData = {
            sourceKey: name,
            sourceBucketName: bucket
          };
          const objectMeta = await client._getObjectMeta(sourceData.sourceBucketName, sourceData.sourceKey, {});
          const fileSize = objectMeta.res.headers['content-length'];

          const result = await client.initMultipartUpload(copyName);

          const partSize = 100 * 1024; // 100kb
          const dones = [];
          const uploadFn = async i => {
            const start = partSize * (i - 1);
            const end = Math.min(start + partSize, fileSize);
            const range = `${start}-${end - 1}`;
            const part = await store.uploadPartCopy(copyName, result.uploadId, i, range, sourceData, {});
            dones.push({
              number: i,
              etag: part.res.headers.etag
            });
          };

          await Promise.all(
            Array(10)
              .fill(1)
              .map((v, i) => uploadFn(i + 1))
          );

          const complete = await client.completeMultipartUpload(copyName, result.uploadId, dones);

          assert.equal(complete.res.status, 200);
        });

        it('should copy with multipart upload copy', async () => {
          const client = store;
          const copyName = `${prefix}multipart/upload-file-with-copy-new`;
          const result = await client.multipartUploadCopy(
            copyName,
            {
              sourceKey: name,
              sourceBucketName: bucket
            },
            {
              partSize: 256 * 1024
            }
          );

          assert.equal(result.res.status, 200);
        });

        it('should multipart upload copy in IE10', async () => {
          const copyName = `${prefix}multipart/upload-copy-in-ie10`;
          const clientTmp = oss({ ...config, ...moreConfigs });
          clientTmp.useBucket(bucket, bucketRegion);
          const checkBrowserAndVersion = sinon
            .stub(clientTmp, 'checkBrowserAndVersion')
            .callsFake((browser, version) => browser === 'Internet Explorer' && version === '10');
          const result = await clientTmp.multipartUploadCopy(
            copyName,
            {
              sourceKey: name,
              sourceBucketName: bucket
            },
            {
              partSize: 100 * 1024
            }
          );
          assert.equal(result.res.status, 200);
          checkBrowserAndVersion.restore();
        });

        it('should multipart upload copy with parallel = 1', async () => {
          const client = store;
          const copyName = `${prefix}multipart/upload-file-with-copy-parallel-1`;
          const result = await client.multipartUploadCopy(
            copyName,
            {
              sourceKey: name,
              sourceBucketName: bucket
            },
            {
              partSize: 256 * 1024,
              parallel: 1
            }
          );

          assert.equal(result.res.status, 200);
        });

        it('should multipart copy with cancel and resume', async () => {
          const client = store;
          const copyName = `${prefix}multipart/upload-file-with-copy-cancel`;
          let tempCheckpoint = null;
          try {
            await client.multipartUploadCopy(
              copyName,
              {
                sourceKey: name,
                sourceBucketName: bucket
              },
              {
                partSize: 100 * 1024,
                progress(p, checkpoint) {
                  tempCheckpoint = checkpoint;
                  if (p > 0.5) {
                    client.cancel();
                  }
                }
              }
            );
          } catch (err) {
            assert.equal(client.isCancel(), true);
          }

          const result = await client.multipartUploadCopy(
            copyName,
            {
              sourceKey: name,
              sourceBucketName: bucket
            },
            {
              partSize: 100 * 1024,
              checkpoint: tempCheckpoint,
              progress(p) {
                assert.equal(p > 0.5, true);
              }
            }
          );

          assert.equal(result.res.status, 200);
        });

        it('should multipart copy with exception', async () => {
          const copyName = `${prefix}multipart/upload-file-with-copy-exception`;
          const clientTmp = oss({ ...config, ...moreConfigs });
          clientTmp.useBucket(bucket, bucketRegion);
          const stubUploadPart = sinon
            .stub(clientTmp, 'uploadPartCopy')
            .callsFake(async (objectKey, uploadId, partNo) => {
              if (partNo === 1) {
                throw new Error('TestErrorException');
              }
            });

          let errorMsg;
          let errPartNum;
          try {
            await clientTmp.multipartUploadCopy(copyName, {
              sourceKey: name,
              sourceBucketName: bucket
            });
          } catch (err) {
            errorMsg = err.message;
            errPartNum = err.partNum;
          }
          assert.equal(errorMsg, 'Failed to copy some parts with error: Error: TestErrorException part_num: 1');
          assert.equal(errPartNum, 1);
          stubUploadPart.restore();
        });

        it('should upload copy with list part', async () => {
          const tempFileName = await utils.createTempFile('multipart-upload-list-part', 2 * 1024 * 1024);
          const tempName = `${prefix}multipart/upload-list-part`;
          await store.multipartUpload(tempName, tempFileName);
          const client = store;
          const copyName = `${prefix}multipart/upload-list-part-copy`;
          let uploadIdz = null;
          try {
            await client.multipartUploadCopy(
              copyName,
              {
                sourceKey: name,
                sourceBucketName: bucket
              },
              {
                parallel: 1,
                partSize: 100 * 1024,
                progress(p, checkpoint) {
                  if (p === 0) {
                    uploadIdz = checkpoint.uploadId;
                  }
                  if (p > 0.5) {
                    client.cancel();
                  }
                }
              }
            );
          } catch (err) {
            /* eslint no-empty: [0] */
          }

          const result = await store.listParts(
            copyName,
            uploadIdz,
            {
              'max-parts': 1000
            },
            {}
          );

          assert.equal(result.res.status, 200);
        });
      });

      describe('multipartUploadStreams', () => {
        afterEach(mm.restore);
        it('multipartUploadStreams.length', async () => {
          const uploadPart = store._uploadPart;
          let i = 0;
          const LIMIT = 1;
          mm(store, '_uploadPart', function (name, uploadId, partNo, data) {
            if (i === LIMIT) {
              throw new Error('mock upload part fail.');
            } else {
              i++;
              return uploadPart.call(this, name, uploadId, partNo, data);
            }
          });

          const fileName = await utils.createTempFile(`multipart-upload-file-${Date.now()}`, 1024 * 1024);
          const name = `${prefix}multipart/upload-file-${Date.now()}`;
          const name1 = `${prefix}multipart/upload-file-1-${Date.now()}`;

          try {
            await Promise.all([store.multipartUpload(name, fileName), store.multipartUpload(name1, fileName)]);
            assert.fail('Expects to throw an error');
          } catch (e) {
            assert(e.message.includes('mock upload part fail.'));
          }

          await utils.sleep(3000);

          mm.restore();

          await Promise.all([store.multipartUpload(name, fileName), store.multipartUpload(name1, fileName)]);

          assert.strictEqual(store.multipartUploadStreams.length, 0);
        });

        it('destroy the stream when multipartUploaded and the cancel method is called', async () => {
          const fileName = await utils.createTempFile(`multipart-upload-file-${Date.now()}`, 1024 * 1024);
          let stream;
          mm(store, '_uploadPart', (_name, _uploadId, _partNo, data) => {
            stream = data.stream;
            throw new Error('mock upload part fail.');
          });

          const name = `${prefix}multipart/upload-file-${Date.now()}`;
          try {
            await store.multipartUpload(name, fileName);
          } catch (e) {
            store.cancel();
          }
          mm.restore();
          assert.strictEqual(stream.destroyed, true);
        });
      });

      describe('set headers', () => {
        afterEach(mm.restore);

        it('Test whether the speed limit setting for sharded upload is effective', async () => {
          if (store.options.cloudBoxId) return;
          const file = await utils.createTempFile('multipart-upload-file-set-header', 101 * 1024);
          const objectKey = `${prefix}multipart/upload-file-set-header`;
          const req = store.urllib.request;
          let header;
          mm(store.urllib, 'request', (url, args) => {
            header = args.headers;
            return req(url, args);
          });
          const limit = 645763;
          await store.multipartUpload(objectKey, file, {
            headers: {
              'x-oss-server-side-encryption': 'KMS',
              'x-oss-traffic-limit': limit
            }
          });

          assert.equal(header['x-oss-traffic-limit'], 645763);
          assert.equal(header['x-oss-server-side-encryption'], undefined);
        });

        it('should set storage-class header', async () => {
          const filepath = path.join(tmpdir, 'content-storage-class-file.jpg');
          await createFile(filepath);
          const name = `${prefix}ali-sdk/oss/content-type-by-file.png`;
          const storageClass = store.options.cloudBoxId ? 'Standard' : 'IA';
          await store.multipartUpload(name, filepath, {
            mime: 'text/plain',
            headers: { 'x-oss-storage-class': storageClass }
          });
          const result = await store.head(name);
          assert.equal(result.res.headers['content-type'], 'text/plain');
          assert.equal(result.res.headers['x-oss-storage-class'], storageClass);
        });
      });
    });
  });
});
