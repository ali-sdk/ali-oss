const CRC64 = require('../../../lib/common/utils/crc64/crc64');
const crc = require('crc64-ecma182');
const assert = require('assert');
const path = require('path');
const oss = require('../../..');
const fs = require('fs');
const config = require('../../config').oss;
const utils = require('../utils');

require('should');

const result1 = '11051210869376104954';
const result2 = '5178350320981835788';

describe('crc64', () => {
  const { prefix } = utils;
  let uploadContent;
  let checkNumber;
  let store;
  let bucket;
  let bucketRegion;
  const filePath = path.join(__dirname, 'buffer.txt');

  before(async () => {
    uploadContent = Buffer.from(
      Array(1024 * 1024 * 10)
        .fill('a')
        .join('')
    );
    // fs.writeFile(filePath, uploadContent);
    checkNumber = '455889540452056977';
    store = new oss(config);
    bucket = `ali-oss-test-crc-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    await store.putBucket(bucket);
    bucketRegion = config.region;
    store.useBucket(bucket, bucketRegion);
  });

  after(() => {
    utils.cleanBucket(store, bucket);
    utils.cleanBucket(store, bucket);
  });

  describe('test1', () => {
    it('check', () => {
      const r1 = crc.toUInt64String(CRC64.check('123456789'));
      r1.should.equal(result1);

      const r2 = crc.toUInt64String(CRC64.check('123456789', 0));
      r2.should.equal(result1);

      const r3 = crc.toUInt64String(CRC64.check('123456789', '0'));
      r3.should.equal(result1);

      const r4 = crc.toUInt64String(CRC64.check(Buffer.from('123456789')));
      r4.should.equal(result1);

      const r5 = crc.toUInt64String(CRC64.check(Buffer.from('123456789'), 0));
      r5.should.equal(result1);

      const r6 = crc.toUInt64String(CRC64.check(Buffer.from('123456789'), '0'));
      r6.should.equal(result1);
    });

    it('loop check', () => {
      for (let i = 0; i < 100; i++) {
        const r6 = crc.toUInt64String(CRC64.check(Buffer.from('123456789'), 0));
        r6.should.equal(result1);
      }
    });
  });
  describe('test2', () => {
    it('check_stream', done => {
      const readStream = fs.createReadStream(path.join(__dirname, 'apps.png'));

      CRC64.check_stream(readStream, (err, result) => {
        if (!err) {
          crc.toUInt64String(result).should.equal(result2);
        } else {
          console.log(err);
        }
        done();
      });
    });

    it('check_stream 并行', done => {
      const len = 100;
      let c = 0;

      for (let i = 0; i < len; i++) setTimeout(_dig, 100);
      function _dig() {
        const readStream = fs.createReadStream(path.join(__dirname, 'apps.png'));

        CRC64.check_stream(readStream, (err, result) => {
          if (!err) {
            crc.toUInt64String(result).should.equal(result2);
            readStream.close();
            c++;
            if (c >= len) done();
            // else setTimeout(_dig,10);
          } else {
            console.log(err);
          }
        });
      }
    });

    it('put crc64 check', async () => {
      await store.put('test1', uploadContent, { crc64: true });
    });

    it('putStream crc64 check', async () => {
      await store.putStream('test2', fs.createReadStream(filePath), { crc64: true });
    });

    it('multipartUpload crc64 check', async () => {
      await store.multipartUpload('test3', uploadContent, { crc64: true });
    });

    it('get object crc64 check stream', async () => {
      await store.get('test1', { crc64: true });
    });

    it('get object crc64 check buffer', async () => {
      await store.get('test1', 'temp.txt', { crc64: true });
    });

    it('checkCrc64 method', async () => {
      assert(store.checkCrc64(uploadContent, checkNumber) === true);
    });

    it('checkCrc64Stream method', async () => {
      store.checkCrc64File(filePath, (err, data) => {
        if (err) throw new Error('check stream fail');
        assert(checkNumber === data);
      });
    });
  });
});
