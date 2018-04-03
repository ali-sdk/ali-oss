/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (https://github.com/rockuw)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');
var sts = require('../').STS;
var oss = require('..');
var config = require('./config').oss;
var stsConfig = require('./config').sts;

describe('test/sts.test.js', function () {
  describe('assumeRole()', function () {
    it('should assume role', function* () {
      var stsClient = sts(stsConfig);
      var result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy', function*() {
      var stsClient = sts(stsConfig);
      var policy = {
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
      };
      var result = yield* stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should assume role with policy string', function*() {
      var stsClient = sts(stsConfig);
      var policy = `
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
      var result = yield* stsClient.assumeRole(stsConfig.roleArn, policy);
      assert.equal(result.res.status, 200);
    });

    it('should handle error in assume role', function*() {
      var stsClient = sts(stsConfig);
      var policy = `
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
      var stsClient = sts(stsConfig);
      var result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);

      var ossClient = oss({
        region: config.region,
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        bucket: stsConfig.bucket,
      });

      var result = yield ossClient.put('sts/hello', __filename);
      assert.equal(result.res.status, 200);

      var result = yield ossClient.list({
        'max-keys': 10
      });

      assert.equal(result.res.status, 200);
    });
  });
});
