/**!
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
var env = process.env;

describe('test/sts.test.js', function () {
  var stsConfig = {
    accessKeyId: env.ALI_SDK_STS_ID,
    accessKeySecret: env.ALI_SDK_STS_SECRET,
    roleArn: env.ALI_SDK_STS_ROLE,
    bucket: env.ALI_SDK_STS_BUCKET
  };

  describe('assumeRole()', function () {
    it('should assume role', function* () {
      var stsClient = sts(stsConfig);
      var result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);
    })

    it('should list objects using STS', function* () {
      var stsClient = sts(stsConfig);
      var result = yield* stsClient.assumeRole(stsConfig.roleArn);
      assert.equal(result.res.status, 200);

      var ossClient = oss({
        region: 'oss-cn-hangzhou',
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
    })
  });
});
