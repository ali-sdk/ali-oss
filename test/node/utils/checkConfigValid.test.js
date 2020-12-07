const assert = require('assert');
const { checkValidEndpoint, checkValidRegion } = require('../../../lib/common/utils/checkValid');

describe('checkConfigValid()', () => {
  describe('endpoint', () => {
    it('should success when endpoint is valid', () => {
      try {
        const endpoint = 'testa_-.com';
        checkValidEndpoint(endpoint);
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
            checkValidEndpoint(str);
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
        checkValidRegion(region);
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
            checkValidRegion(str);
            assert(false);
          } catch (error) {
            assert(error.message.includes('region'));
          }
        }
      );
    });
  });

});
