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
const sts = require('../..').STS;
const oss = require('../..');
const config = require('../config').oss;
const stsConfig = require('../config').sts;

describe('test/sts.test.js', () => {
  describe('assumeRole()', () => {
    it('should assume role', function* () {
      const stsClient = sts(stsConfig);
      const result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy', function* () {
      const stsClient = sts(stsConfig);
      const policy = {
        Statement: [
          {
            Action: [
              'oss:*',
            ],
            Effect: 'Allow',
            Resource: ['acs:oss:*:*:*'],
          },
        ],
        Version: '1',
      };
      const result = yield* stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy string', function* () {
      const stsClient = sts(stsConfig);
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
      const result = yield* stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should handle error in assume role', function* () {
      const stsClient = sts(stsConfig);
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
        yield* stsClient.assumeRole(stsConfig.roleArn, policy);
        assert(false);
      } catch (err) {
        err.message.should.match(/InvalidParameter.PolicyGrammar/);
      }
    });

    it('should list objects using STS', function* () {
      const stsClient = sts(stsConfig);
      let result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);

      const ossClient = oss({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket,
      });

      result = yield ossClient.put('sts/hello', __filename);
      assert.equal(result.res.status, 200);

      result = yield ossClient.list({
        'max-keys': 10,
      });

      assert.equal(result.res.status, 200);
    });
  });
});
