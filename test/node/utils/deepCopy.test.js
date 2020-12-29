const assert = require('assert');
const { Buffer } = require('buffer');
const { deepCopy, deepCopyWith } = require('../../../lib/common/utils/deepCopy');
const { isBuffer } = require('../../../lib/common/utils/isBuffer');

describe('utils/deepCopy()', () => {
  it('should copy big Buffers correctly', () => {
    // 2^30 - 1 ~ 1GB is max size on 32-bit computer
    // See https://nodejs.org/api/buffer.html#buffer_buffer_constants_max_length
    const numberBytes = Math.pow(2, 30) - 1;
    const obj = {
      buffer: Buffer.alloc(numberBytes)
    };
    assert.deepStrictEqual(deepCopy(obj), obj);
  });

  it('should skip some properties when use deepCopyWith', () => {
    const numberBytes = Math.pow(2, 30) - 1;
    const obj = {
      a: 1,
      b: {
        c: 2
      },
      buffer: Buffer.alloc(numberBytes)
    };
    const copy1 = deepCopyWith(obj, (_, key) => {
      if (key === 'buffer') return null;
    });
    const copy2 = deepCopyWith(obj, _ => {
      if (isBuffer(_)) return null;
    });
    assert.deepStrictEqual(copy1, {
      a: 1,
      b: {
        c: 2
      },
      buffer: null
    });
    assert.deepStrictEqual(copy1, copy2);
  });
});
