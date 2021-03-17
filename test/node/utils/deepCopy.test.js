const assert = require('assert');
const { Buffer } = require('buffer');
const { deepCopy, deepCopyWith } = require('../../../lib/common/utils/deepCopy');

describe('utils/deepCopy()', () => {
  it('should copy big Buffers correctly', () => {
    // 2^30 - 1 ~ 1GB is max size on 32-bit computer
    // See https://nodejs.org/api/buffer.html#buffer_buffer_constants_max_length
    const numberBytes = Math.pow(2, 30) - 1;
    const obj = {
      buffer: Buffer.alloc(numberBytes)
    };
    const copy = deepCopy(obj);
    assert.strictEqual(Object.keys(obj).length, Object.keys(copy).length);
    assert(obj.buffer.equals(copy.buffer));
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
    assert.deepStrictEqual(copy1, {
      a: 1,
      b: {
        c: 2
      },
      buffer: null
    });

    const copy2 = deepCopyWith(obj);
    assert.deepStrictEqual(obj.a, copy2.a);
    assert.deepStrictEqual(obj.b, copy2.b);
    assert(obj.buffer.equals(copy2.buffer));

    const copy3 = deepCopyWith(obj, () => {});
    assert.deepStrictEqual(obj.a, copy3.a);
    assert.deepStrictEqual(obj.b, copy3.b);
    assert(obj.buffer.equals(copy3.buffer));
  });
});
