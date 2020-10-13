const assert = require('assert');
const { checkConfigValid } = require('../../../lib/common/utils/checkConfigValid');

describe('checkConfigValid()', () => {
  describe('endpoint', () => {
    it('should success when endpoint is valid', () => {
      try {
        const endpoint = 'testa_-.com';
        checkConfigValid(endpoint, 'endpoint');
        assert(true);
      } catch (error) {
        assert(false);
      }
    });
    it('should throw when endpoint includes invalid character', () => {
      const errorStr = '中~!@#$%^&*()+={}[]|\\";\',<>?';
      errorStr.split('').map(_ => `test-a_b.${_}.com`).forEach(
        str => {
          try {
            checkConfigValid(str, 'endpoint');
            assert(false);
          } catch (error) {
            assert(error.message.includes('endpoint'));
          }
        }
      );
    });
  });

  describe('region', () => {
    it('should success when region is valid', () => {
      try {
        const region = 'oss-cn-hangzhou';
        checkConfigValid(region, 'region');
        assert(true);
      } catch (error) {
        assert(false);
      }
    });
    it('should throw when region includes invalid character', () => {
      const errorStr = '中~!@#$%^&*()+={}[]|\\";\',<>?';
      errorStr.split('').map(_ => `oss-${_}hangzhou`).forEach(
        str => {
          try {
            checkConfigValid(str, 'region');
            assert(false);
          } catch (error) {
            assert(error.message.includes('region'));
          }
        }
      );
    });
  });

});
