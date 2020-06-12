const { isIP: _isIP } = require('../../lib/common/utils/isIP');
const { includesConf } = require('./utils');
const assert = require('assert');

describe('test/test.js', () => {
  it('ipv4 test', () => {
    // first length is 3
    assert.equal(_isIP('200.255.255.255'), true);
    assert.equal(_isIP('223.255.255.255'), true);
    assert.equal(_isIP('224.255.255.255'), true);
    assert.equal(_isIP('192.0.0.1'), true);
    assert.equal(_isIP('127.0.0.1'), true);
    assert.equal(_isIP('100.0.0.1'), true);
    assert.equal(_isIP('090.0.0.1'), true);
    assert.equal(_isIP('009.0.0.1'), true);
    assert.equal(_isIP('200.001.255.255'), true);

    // first length is 1 or 2
    assert.equal(_isIP('09.255.255.255'), true);
    assert.equal(_isIP('90.255.255.255'), true);
    assert.equal(_isIP('00.255.255.255'), true);
    assert.equal(_isIP('-.0.0.1'), false);
    assert.equal(_isIP('0.0.0.1'), true);
    assert.equal(_isIP('1.0.0.1'), true);

    // test last 3 byte
    assert.equal(_isIP('200.0.255.255'), true);
    assert.equal(_isIP('200.01.255.255'), true);
    assert.equal(_isIP('200.10.255.255'), true);
    assert.equal(_isIP('200.256.255.255'), false);
    assert.equal(_isIP('200.001.255.255'), true);

    assert.equal(_isIP('200.255.0.255'), true);
    assert.equal(_isIP('200.255.01.255'), true);
    assert.equal(_isIP('200.255.10.255'), true);
    assert.equal(_isIP('200.255.256.255'), false);
    assert.equal(_isIP('200.255.001.255'), true);

    assert.equal(_isIP('200.255.255.0'), true);
    assert.equal(_isIP('200.255.255.01'), true);
    assert.equal(_isIP('200.255.255.10'), true);
    assert.equal(_isIP('200.255.255.256'), false);
    assert.equal(_isIP('200.255.255.001'), true);

    // excetion
    assert.equal(_isIP('200.255.255.001'), true);
    assert.equal(_isIP('200'), false);
    assert.equal(_isIP('200.1'), false);
    assert.equal(_isIP('200.1.1'), false);
    assert.equal(_isIP('200.1.1.1.1'), false);
  });
  it('ipv6 test', () => {
    assert.equal(_isIP('1:2:3:4:5:6:7::'), true);
    assert.equal(_isIP('1:2:3:4:5:6:7:8'), true);
    assert.equal(_isIP('1:2:3:4:5:6::'), true);
    assert.equal(_isIP('1:2:3:4:5:6::8'), true);
    assert.equal(_isIP('1:2:3:4:5::'), true);
    assert.equal(_isIP('1:2:3:4:5::8'), true);
    assert.equal(_isIP('1:2:3:4::'), true);
    assert.equal(_isIP('1:2:3:4::8'), true);
    assert.equal(_isIP('1:2:3::'), true);
    assert.equal(_isIP('1:2:3::8'), true);
    assert.equal(_isIP('1:2::'), true);
    assert.equal(_isIP('1:2::8'), true);
    assert.equal(_isIP('1::'), true);
    assert.equal(_isIP('1::8'), true);
    assert.equal(_isIP('::'), true);
    assert.equal(_isIP('::8'), true);
    assert.equal(_isIP('::7:8'), true);
    assert.equal(_isIP('::6:7:8'), true);
    assert.equal(_isIP('::5:6:7:8'), true);
    assert.equal(_isIP('::4:5:6:7:8'), true);
    assert.equal(_isIP('::3:4:5:6:7:8'), true);
    assert.equal(_isIP('::2:3:4:5:6:7:8'), true);
    assert.equal(_isIP('A:0f:0F:FFFF:5:6:7:8'), true);
    assert.equal(_isIP('A:0f:0F:FFFF1:5:6:7:8'), false);
    assert.equal(_isIP('G:0f:0F:FFFF:5:6:7:8'), false);
  });
});

describe('test/includesConf.js', () => {
  it('shoud return true when conf-item is primitive value', () => {
    const data = {
      testNum: 1,
      testStr: '2',
      testUndefined: undefined,
      testNull: null,
      testExtral: 'extral'
    };
    const conf = {
      testNum: 1,
      testStr: '2',
      testUndefined: undefined,
      testNull: null
    };
    assert(includesConf(data, conf));
  });
  it('shoud return false when conf-item is primitive value and conf not in data', () => {
    const data = {
      testNum: 1,
      testStr: '2',
      testUndefined: undefined,
      testNull: null,
      testExtral: 'extral'
    };
    const conf = {
      testNonExist: 1
    };
    const conf1 = {
      testExtral: 'test'
    };
    assert(!includesConf(data, conf));
    assert(!includesConf(data, conf1));
  });
  it('shoud return true when conf-item is simple Array', () => {
    const data = {
      testArray1: ['extral', '1', 0, undefined],
      testExtral: 'extral'
    };
    const conf = {
      testArray1: ['1', 0, undefined]
    };
    assert(includesConf(data, conf));
  });
  it('shoud return false when conf-item is simple Array and conf not in data', () => {
    const data = {
      testArray1: ['extral', '1', 0, undefined],
      testExtral: 'extral'
    };
    const conf = {
      testArray1: ['1', 0, undefined, 'noexist']
    };
    assert(!includesConf(data, conf));
  });
  it('shoud return true when conf-item is simple Object', () => {
    const data = {
      testObject: { test: 1, test1: 2 },
      testExtral: 'extral'
    };
    const conf = {
      testObject: { test: 1 }
    };
    assert(includesConf(data, conf));
  });
  it('shoud return false when conf-item is simple Object and conf not in data', () => {
    const data = {
      testObject: { test: 1, test1: 2 },
      testExtral: 'extral'
    };
    const conf = {
      testObject: { test: 1, noExist: 'test' }
    };
    assert(!includesConf(data, conf));
  });
  it('shoud return true when conf-item is complex Array', () => {
    const data = {
      testArray: [{ test: 1, test1: 2 }, { test: 2 }],
      testExtral: 'extral'
    };
    const conf = {
      testArray: [{ test: 2 }]
    };
    assert(includesConf(data, conf));
  });
  it('shoud return false when conf-item is complex Array and conf not in data', () => {
    const data = {
      testArray: [{ test: 1, test1: 2 }, { test: 2 }],
      testExtral: 'extral'
    };
    const conf = {
      testArray: [{ test: 0 }]
    };
    assert(!includesConf(data, conf));
  });
  it('shoud return true when conf-item is complex Object', () => {
    const data = {
      testObject: {
        test01: {
          test11: {
            a: 1
          },
          test12: 1123
        },
        test02: [{ test11: 1 }, '123', 0, undefined, '456']
      },
      testExtral: 'extral'
    };
    const conf = {
      testObject: {
        test01: {
          test11: {
            a: 1
          }
        },
        test02: [{ test11: 1 }, '123', 0, undefined]
      }
    };
    assert(includesConf(data, conf));
  });
  it('shoud return false when conf-item is complex Object and conf not in data', () => {
    const data = {
      testObject: {
        test01: {
          test11: {
            a: 1
          },
          test12: 1123
        },
        test02: [{ test11: 1 }, '123', 0, undefined, '456']
      },
      testExtral: 'extral'
    };
    const conf = {
      testObject: {
        test01: {
          test11: {
            a: 1,
            b: 'test cpx'
          }
        },
        test02: [{ test11: 1 }, '123', 0, undefined]
      }
    };
    assert(!includesConf(data, conf));
  });
});
