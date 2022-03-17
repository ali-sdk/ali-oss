const CRC64 = require('../../../lib/crc64/crc64');
const path = require('path');
const fs = require('fs');
require('should');

const result1 = '11051210869376104954';
const result2 = '5178350320981835788';

describe('crc64', () => {
  describe('test1', () => {
    it('check', () => {
      const r1 = CRC64.check('123456789');
      r1.should.equal(result1);

      const r2 = CRC64.check(0, '123456789');
      r2.should.equal(result1);

      const r3 = CRC64.check('0', '123456789');
      r3.should.equal(result1);

      const r4 = CRC64.check(Buffer.from('123456789'));
      r4.should.equal(result1);

      const r5 = CRC64.check(0, Buffer.from('123456789'));
      r5.should.equal(result1);

      const r6 = CRC64.check('0', Buffer.from('123456789'));
      r6.should.equal(result1);
    });

    it('loop check', () => {
      for (let i = 0; i < 100; i++) {
        const r6 = CRC64.check(0, Buffer.from('123456789'));
        r6.should.equal(result1);
      }
    });
  });
  describe('test2', () => {
    it('check_stream', done => {
      const readStream = fs.createReadStream(path.join(__dirname, 'apps.png'));

      CRC64.check_stream(readStream, (err, result) => {
        if (!err) {
          result.should.equal(result2);
        } else {
          console.log(err);
        }
        done();
      });
    });

    it('check_stream 串行', done => {
      const len = 100;
      let c = 0;

      _dig();
      function _dig() {
        const readStream = fs.createReadStream(path.join(__dirname, 'apps.png'));

        CRC64.check_stream(readStream, (err, result) => {
          if (!err) {
            result.should.equal(result2);
            readStream.close();
            c++;
            if (c >= len) done();
            else setTimeout(_dig, 10);
          } else {
            console.log(err);
          }
        });
      }
    });

    it('check_stream 并行', done => {
      const len = 100;
      let c = 0;

      for (let i = 0; i < len; i++) setTimeout(_dig, 100);
      function _dig() {
        const readStream = fs.createReadStream(path.join(__dirname, 'apps.png'));

        CRC64.check_stream(readStream, (err, result) => {
          if (!err) {
            result.should.equal(result2);
            readStream.close();
            c++;
            if (c >= len) done();
            //else setTimeout(_dig,10);
          } else {
            console.log(err);
          }
        });
      }
    });
  });
});
