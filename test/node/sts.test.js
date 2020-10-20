/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (https://github.com/rockuw)
 */


/**
 * Module dependencies.
 */

const assert = require('assert');
const utils = require('./utils');
const { STS } = require('../..');
const OSS = require('../..');
const { formatObjKey } = require('../../lib/common/utils/formatObjKey');
const config = require('../config').oss;
const stsConfig = require('../config').sts;
const mm = require('mm');
const { obj2xml } = require('../../lib/common/utils/obj2xml');

describe('test/sts.test.js', () => {
  const { prefix } = utils;
  describe('assumeRole()', () => {
    it('should assume role', async () => {
      const stsClient = new STS(stsConfig);
      const result = await stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy', async () => {
      const stsClient = new STS(stsConfig);
      const policy = {
        Statement: [
          {
            Action: [
              'oss:*'
            ],
            Effect: 'Allow',
            Resource: ['acs:oss:*:*:*']
          }
        ],
        Version: '1'
      };
      const result = await stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy string', async () => {
      const stsClient = new STS(stsConfig);
      const policy = `
      {
        "Statement": [
          {
            "Action": [
              "oss:*"
            ],
            "Effect": "Allow",
            "Resource": ["acs:oss:*:*:*"]
          }
        ],
        "Version": "1"
      }`;
      const result = await stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should handle error in assume role', async () => {
      const stsClient = new STS(stsConfig);
      const policy = `
      {
        "Statements": [
          {
            "Action": [
              "oss:*"
            ],
            "Effect": "Allow",
            "Resource": ["acs:oss:*:*:*"]
          }
        ],
        "Version": "1"
      }`;

      try {
        await stsClient.assumeRole(stsConfig.roleArn, policy);
        assert(false);
      } catch (err) {
        err.message.should.match(/InvalidParameter.PolicyGrammar/);
      }
    });

    it('should list objects using STS', async () => {
      const stsClient = new STS(stsConfig);
      let result = await stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);

      const ossClient = new OSS({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket
      });

      const name = `${prefix}ali-sdk/oss/sts-put1.js`;
      result = await ossClient.put(name, __filename);
      assert.equal(result.res.status, 200);

      result = await ossClient.list({
        'max-keys': 10
      });

      assert.equal(result.res.status, 200);
    });

    it('should delete multi objects using STS', async () => {
      const stsClient = new STS(stsConfig);

      let policy = {
        Statement: [
          {
            Action: [
              'oss:PutObject'
            ],
            Effect: 'Allow',
            Resource: ['acs:oss:*:*:*']
          }
        ],
        Version: '1'
      };

      let result = await stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);

      let ossClient = new OSS({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket
      });

      const name1 = `${prefix}ali-sdk/oss/sts-put1.js`;
      const name2 = `${prefix}ali-sdk/oss/sts-put2.js`;
      result = await ossClient.put(name1, __filename);
      assert.equal(result.res.status, 200);

      result = await ossClient.put(name2, __filename);
      assert.equal(result.res.status, 200);

      try {
        await ossClient.deleteMulti([name1, name2]);
        assert(false);
      } catch (err) {
        err.message.should.match(/Access denied by authorizer's policy/);
      }

      policy = {
        Statement: [
          {
            Action: [
              'oss:DeleteObject'
            ],
            Effect: 'Allow',
            Resource: ['acs:oss:*:*:*']
          }
        ],
        Version: '1'
      };

      result = await stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);

      ossClient = new OSS({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket
      });

      result = await ossClient.deleteMulti([name1, name2]);
      assert.equal(result.res.status, 200);
    });
  });

  describe('refreshSTSToken()', () => {
    const stsClient = new STS(stsConfig);

    let store;
    before(async () => {
      let { credentials } = await stsClient.assumeRole(stsConfig.roleArn);
      credentials = formatObjKey(credentials, 'firstLowerCase');
      const testRefreshSTSTokenConf = {
        ...credentials,
      };
      store = new OSS(testRefreshSTSTokenConf);
    });
    it('should refresh sts token when token is expired', async () => {
      try {
        store.options.refreshSTSToken = async () => {
          mm.restore();
          const { credentials } = await stsClient.assumeRole(stsConfig.roleArn);
          return credentials;
        };
        // 模拟sts过期错误
        const errData = {
          Test: {
            Code: 'InvalidAccessKeyId'
          }
        };
        mm.error(store.urllib, 'request', {
          status: 403,
          headers: {},
          data: obj2xml(errData)
        });
        const res = await store.listBuckets();
        assert.strictEqual(res.res.status, 200);
        assert(res.buckets && Array.isArray(res.buckets));
      } catch (error) {
        assert(false, error);
      }
    });
  });

});
