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
});
