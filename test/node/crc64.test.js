const assert = require('assert');
const { crc64, toUInt64String } = require('crc64-ecma182');
const { CRC64Combine } = require('../../lib/common/utils/crc64');

describe.only('test/crc64.test.js', () => {
  const content = 'This is a test content34567890#$%^&*GHJK{:><KL:P(O)P:}中文lllk12312312413some 中文碎片441451451234';
  const correctCRC64 = '5414076692182420664';
  it('should calculate the correct crc64 with crc64(buff, prev)', () => {
    const CRC64_1 = toUInt64String(crc64(content));
    // step 1
    const ret = crc64(Buffer.from(content.slice(0, 5)));
    // step 2
    const CRC64_2 = toUInt64String(crc64(content.slice(5), ret));
    assert.strictEqual(CRC64_1, correctCRC64);
    assert.strictEqual(CRC64_1, CRC64_2);
  });

  it('should be able to calculate the correct crc64 with CRC64Combine', () => {
    const parts = [];
    const size = 64;
    const buf = Buffer.from(content);
    for (let i = 0; i < buf.length; i += size) {
      const crc64_value = toUInt64String(crc64(buf.slice(i, i + size)));
      parts.push({
        len: Math.min(buf.length - i, size),
        CRC64: crc64_value
      });
    }
    let actualCRC = parts[0].CRC64;
    for (let i = 1; i < parts.length; i++) {
      actualCRC = CRC64Combine(actualCRC, parts[i].CRC64, parts[i].len);
    }
    assert.strictEqual(actualCRC, correctCRC64);
  });
});
