/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');
var sts = require('../').STS;
var env = process.env;

describe('test/sts.test.js', function () {
  var stsConfig = {
    accessKeyId: env.ALI_SDK_STS_ID,
    accessKeySecret: env.ALI_SDK_STS_SECRET,
    roleArn: env.ALI_SDK_STS_ROLE
  };

  describe('assumeRole()', function () {
    it('should assume role', function* () {
      var stsClient = sts(stsConfig);
      var result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.ok(result.Credentials.AccessKeyId);
    })
  });
});
