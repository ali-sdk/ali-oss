const assert = require('assert');
const utils = require('./utils');
const sts = require('../..').STS;
const OSS = require('../..');
const { oss: config, conditions } = require('../config');
const stsConfig = require('../config').sts;
const mm = require('mm');

describe('test/sts.test.js', () => {
  const { prefix } = utils;
  const product = config.cloudBoxId === undefined ? 'oss' : 'oss-cloudbox';
  conditions.forEach((moreConfigs, index) => {
    describe(`test sts in iterate ${index}`, () => {
      describe('assumeRole()', () => {
        it('should assume role', async () => {
          const stsClient = sts(stsConfig);
          const result = await stsClient.assumeRole(stsConfig.roleArn);
          assert.strictEqual(result.res.status, 200);
        });

        it('should assume role with policy', async () => {
          const stsClient = sts(stsConfig);
          const policy = {
            Statement: [
              {
                Action: [`${product}:*`],
                Effect: 'Allow',
                Resource: [`acs:${product}:*:*:*`]
              }
            ],
            Version: '1'
          };
          const result = await stsClient.assumeRole(stsConfig.roleArn, policy);
          assert.strictEqual(result.res.status, 200);
        });

        it('should assume role with policy string', async () => {
          const stsClient = sts(stsConfig);
          const policy = `
          {
            "Statement": [
              {
                "Action": [
                  "${product}:*"
                ],
                "Effect": "Allow",
                "Resource": ["acs:${product}:*:*:*"]
              }
            ],
            "Version": "1"
          }`;
          const result = await stsClient.assumeRole(stsConfig.roleArn, policy);
          assert.strictEqual(result.res.status, 200);
        });

        it('should handle error in assume role', async () => {
          const stsClient = sts(stsConfig);
          const policy = `
          {
            "Statements": [
              {
                "Action": [
                  "${product}:*"
                ],
                "Effect": "Allow",
                "Resource": ["acs:${product}:*:*:*"]
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
          const stsClient = sts(stsConfig);
          let result = await stsClient.assumeRole(stsConfig.roleArn);
          assert.strictEqual(result.res.status, 200);
          const ossClient = new OSS({
            // region: config.region,
            ...config,
            accessKeyId: result.credentials.AccessKeyId,
            accessKeySecret: result.credentials.AccessKeySecret,
            stsToken: result.credentials.SecurityToken,
            bucket: stsConfig.bucket,
            ...moreConfigs
          });

          const name = `${prefix}ali-sdk/oss/sts-put1.js`;
          result = await ossClient.put(name, __filename);
          assert.strictEqual(result.res.status, 200);

          result = await ossClient.list({
            'max-keys': 10
          });

          assert.strictEqual(result.res.status, 200);
        });

        it('should delete multi objects using STS', async () => {
          const stsClient = sts(stsConfig);

          let policy = {
            Statement: [
              {
                Action: [`${product}:PutObject`],
                Effect: 'Allow',
                Resource: [`acs:${product}:*:*:*`]
              }
            ],
            Version: '1'
          };

          let result = await stsClient.assumeRole(stsConfig.roleArn, policy);
          assert.strictEqual(result.res.status, 200);

          let ossClient = new OSS({
            ...config,
            accessKeyId: result.credentials.AccessKeyId,
            accessKeySecret: result.credentials.AccessKeySecret,
            stsToken: result.credentials.SecurityToken,
            bucket: stsConfig.bucket,
            ...moreConfigs
          });

          const name1 = `${prefix}ali-sdk/oss/sts-put1.js`;
          const name2 = `${prefix}ali-sdk/oss/sts-put2.js`;
          result = await ossClient.put(name1, __filename);
          assert.strictEqual(result.res.status, 200);

          result = await ossClient.put(name2, __filename);
          assert.strictEqual(result.res.status, 200);

          try {
            await ossClient.deleteMulti([name1, name2]);
            assert(false);
          } catch (err) {
            err.message.should.match(/Access denied by authorizer's policy/);
          }

          policy = {
            Statement: [
              {
                Action: [`${product}:DeleteObject`],
                Effect: 'Allow',
                Resource: [`acs:${product}:*:*:*`]
              }
            ],
            Version: '1'
          };

          result = await stsClient.assumeRole(stsConfig.roleArn, policy);
          assert.strictEqual(result.res.status, 200);

          ossClient = new OSS({
            ...config,
            accessKeyId: result.credentials.AccessKeyId,
            accessKeySecret: result.credentials.AccessKeySecret,
            stsToken: result.credentials.SecurityToken,
            bucket: stsConfig.bucket,
            ...moreConfigs
          });

          result = await ossClient.deleteMulti([name1, name2]);
          assert.strictEqual(result.res.status, 200);
        });
      });

      describe('refreshSTSToken()', () => {
        const stsClient = sts(stsConfig);

        let store;
        before(async () => {
          const { credentials } = await stsClient.assumeRole(stsConfig.roleArn);
          const testRefreshSTSTokenConf = {
            region: config.region,
            accessKeyId: credentials.AccessKeyId,
            accessKeySecret: credentials.AccessKeySecret,
            stsToken: credentials.SecurityToken,
            bucket: stsConfig.bucket,
            refreshSTSTokenInterval: 1000,
            ...moreConfigs
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
            const ak = store.options.accessKeyId;
            await store.listBuckets();
            assert.strictEqual(ak, store.options.accessKeyId);
            await utils.sleep(2000);
            await store.listBuckets();
            assert.notStrictEqual(ak, store.options.accessKeyId);
          } catch (error) {
            assert.fail(error);
          }
        });

        it('asyncSignatureUrl and signatureUrlV4 should use refreshSTSToken', async () => {
          const { credentials } = await stsClient.assumeRole(stsConfig.roleArn);
          let flag = false;

          store = new OSS({
            region: config.region,
            accessKeyId: credentials.AccessKeyId,
            accessKeySecret: credentials.AccessKeySecret,
            stsToken: credentials.SecurityToken,
            refreshSTSToken: () => {
              flag = true;
              return {
                accessKeyId: 'b',
                accessKeySecret: 'b',
                stsToken: 'b'
              };
            },
            bucket: stsConfig.bucket,
            refreshSTSTokenInterval: 1000,
            ...moreConfigs
          });
          await utils.sleep(2000);
          await store.asyncSignatureUrl('test.txt');

          assert(flag);

          flag = false;
          await utils.sleep(2000);
          await store.signatureUrlV4('GET', 60, undefined, 'test.txt');
          assert(flag);
        });
      });
    });
  });
});
