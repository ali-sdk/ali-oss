const assert = require('assert');
const { Buffer } = require('buffer');
const { deepCopy } = require('../../../lib/common/utils/deepCopy');

describe('utils/deepCopy()', () => {
  it('should copy big Buffers correctly', () => {
    // 2^30 - 1 ~ 1GB is max size on 32-bit computer
    // See https://nodejs.org/api/buffer.html#buffer_buffer_constants_max_length
    const numberBytes = Math.pow(2, 30) - 1;
    const obj = {
      buffer: Buffer.alloc(numberBytes),
    };
    assert.deepStrictEqual(deepCopy(obj), obj);
  });
});
