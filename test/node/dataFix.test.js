const assert = require('assert');
const { dataFix } = require('../../lib/common/utils/dataFix');
const { sleep } = require('./utils');

describe('dataFix()', () => {
  before(async () => {
    await sleep(1000);
  });
  describe('data is not object', () => {
    it('should return without handle', () => {
      const data = 'string';

      const conf = {
        remove: ['rm', 'rm2']
      };
      dataFix(data, conf);
    });
  });

  describe('remove : array - remove unwanted props', () => {
    it('should remove what is not needed', () => {
      const data = {
        rmNot: 'do NOT remove me',
        rm: [],
        rm2: 'what ever value dos NOT matter'
      };

      const conf = {
        remove: ['rm', 'rm2']
      };

      dataFix(data, conf);

      assert(!conf.remove.find(_ => Object.prototype.hasOwnProperty.call(data, _)));
      assert(Object.prototype.hasOwnProperty.call(data, 'rmNot'));
    });
  });

  describe('lowerFirst : boolean - turn key into first-letter-lower-case', () => {
    const One = 'One';
    const Another = 'Another';
    const Both = 'Both';
    const both = 'both';
    const data = {
      One,
      Another,
      Both,
      both
    };

    dataFix(data, {
      lowerFirst: true
    });

    it('should covert and remove the Old', () => {
      assert(!data.One);
      assert(!data.Another);
      assert(data.one);
      assert(data.another);
    });

    it('should not covert if lower-case will replace existed', () => {
      assert.strictEqual(Both, data.Both);
      assert.strictEqual(both, data.both);
    });
  });

  describe('bool : array - turn values into boolean if can be converted', () => {
    const cannotConvertNumber2 = 2;
    const cannotConvertOtherString = 'cannot convert';
    const data = {
      trueB: true,
      trueL: 'true',
      trueU: 'TRUE',
      true1: '1',
      true1N: 1,
      falseB: false,
      falseL: 'false',
      falseU: 'FALSE',
      false0: '0',
      false0N: 0,
      falseNull: null,
      cannotConvertNumber2,
      cannotConvertOtherString
    };

    dataFix(data, {
      bool: [
        'trueB',
        'trueL',
        'trueU',
        'true1',
        'true1N',
        'falseB',
        'falseL',
        'falseU',
        'false0',
        'false0N',
        'falseNull',
        'cannotConvertNumber2',
        'cannotConvertOtherString',
        'nonExist'
      ]
    });

    it('should boolean true/false remain boolean', () => {
      assert.strictEqual(data.trueB, true);
      assert.strictEqual(data.falseB, false);
    });

    it('should convert true TURE 1 (number or string) to boolean true', () => {
      assert.strictEqual(data.trueL, true);
      assert.strictEqual(data.trueU, true);
      assert.strictEqual(data.true1, true);
      assert.strictEqual(data.true1N, true);
    });

    it('should convert false FALSE 0 (number or string) to boolean false', () => {
      assert.strictEqual(data.falseL, false);
      assert.strictEqual(data.falseU, false);
      assert.strictEqual(data.false0, false);
      assert.strictEqual(data.false0N, false);
    });

    it('should convert null / undefined to false', () => {
      assert.strictEqual(data.falseNull, false);
      assert.strictEqual(data.nonExist, false);
    });

    it('should leave those cannot be converted as is', () => {
      assert.strictEqual(cannotConvertNumber2, data.cannotConvertNumber2);
      assert.strictEqual(cannotConvertOtherString, data.cannotConvertOtherString);
    });
  });

  describe('rename : object - rename bad prop keys into better names', () => {
    const existValue = 123456;
    const renameToAlready = 'rename to already';
    const alreadyExist = 'already';
    const data = {
      existValue,
      renameToAlready,
      alreadyExist
    };

    dataFix(data, {
      rename: {
        existValue: 'existValueRenamed',
        nonExistValue: 'nonExistValueRenamed',
        renameToAlready: 'alreadyExist'
      }
    });

    it('should replace existed values with new name and same value', () => {
      assert(!data.existValue);
      assert.strictEqual(data.existValueRenamed, existValue);
    });

    it('should not add prop when the prop-to-be-renamed does NOT exist', () => {
      assert(!data.nonExistValueRenamed);
      assert(!data.nonExistValue);
    });

    it('should not rename if a name already exist', () => {
      assert.strictEqual(data.alreadyExist, alreadyExist);
      assert.strictEqual(data.renameToAlready, renameToAlready);
    });
  });

  describe('camel : array - turn key into camel string', () => {
    const Both = 'Both';
    const both = 'bothBoth';
    const data = {
      One: 'One',
      'Another-another': 'Another-another',
      'Both-both': Both,
      bothBoth: both
    };

    dataFix(data, {
      camel: [...Object.keys(data), 'noExistkey']
    });

    it('should covert and remove the Old', () => {
      assert(data.one);
      assert(data.anotherAnother);
    });

    it('should not covert if camel will replace existed', () => {
      assert.strictEqual(Both, data['Both-both']);
      assert.strictEqual(both, data.bothBoth);
    });

    it('should not covert if camel origin key is not exist', () => {
      // eslint-disable-next-line no-prototype-builtins
      assert(!data.hasOwnProperty('NoExistkey'));
    });
  });

  describe('finalKill: function', () => {
    it('should correct fix data', () => {
      const data = {
        test: 1,
        test1: 2,
        needDelete: 'del',
        needDelete1: 'del'
      };

      const delKey = 'needDelete';
      const addKey = 'addKey';
      dataFix(data, {}, o => {
        Object.keys(o).forEach(_ => {
          if (_.includes(delKey)) delete o[_];
        });
        o[addKey] = addKey;
      });

      assert(!Object.keys(data).find(_ => _.includes(delKey)));
      assert.strictEqual(data.addKey, addKey);
    });
  });
});
