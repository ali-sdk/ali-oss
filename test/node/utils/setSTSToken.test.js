const { setSTSToken } = require('../../../lib/common/utils/setSTSToken');
const assert = require('assert');

describe('setSTSToken()', () => {
  it('should set sts token', async () => {
    const refreshSTSToken = () => {
      return {
        securityToken: 'test-securityToken',
        accessKeyId: 'test-AccessKeyId',
        accessKeySecret: 'test-accessKeySecret',
      };
    };
    const test_set_token = { options: { refreshSTSToken } };

    await setSTSToken.call(test_set_token);

    assert(test_set_token.options.accessKeyId);
    assert(test_set_token.options.accessKeySecret);
    assert(test_set_token.options.securityToken);
  });

  it('should throw when return without necessary key', async () => {
    const securityToken = 'test-securityToken';
    const accessKeyId = 'test-AccessKeyId';
    const accessKeySecret = 'test-accessKeySecret';
    const stsToken = {
      securityToken,
      accessKeyId,
      accessKeySecret,
    };
    const refreshSTSToken = () => {
      return stsToken;
    };
    const test_set_token = { options: { refreshSTSToken } };

    try {
      delete stsToken.securityToken;
      await setSTSToken.call(test_set_token);
      assert(false);
    } catch (error) {
      assert(error.message.includes('stsToken'));
    }

    try {
      stsToken.securityToken = securityToken;
      delete stsToken.accessKeyId;
      await setSTSToken.call(test_set_token);
      assert(false);
    } catch (error) {
      assert(error.message.includes('accessKeyId'));
    }
    try {
      stsToken.accessKeyId = accessKeyId;
      delete stsToken.accessKeySecret;
      await setSTSToken.call(test_set_token);
      assert(false);
    } catch (error) {
      assert(error.message.includes('accessKeySecret'));
    }
  });
});
