const express = require('express');
const STS = require('ali-oss').STS;
const MpUploadOssHelper = require('./uploadOssHelper');

const app = express();

// 签名
app.get('/signature', (req, res) => {
  const helper = new MpUploadOssHelper({
    accessKeyId: 'your ak',
    accessKeySecret: 'your sk',
    timeout: 1,
    maxSize: 10
  });
  const params = helper.createUploadParams();
  res.json(params);
});

// sts
const stsClient = new STS({
  accessKeyId: 'your ak',
  accessKeySecret: 'your sk'
});

// 获取token
async function getToken() {
  const STS_ROLE = 'acs:ram::xxxx:role/xxxx'; // 指定角色的ARN。格式为acs:ram::$accountID:role/$roleName。
  const STSpolicy = {
    Statement: [
      {
        Action: ['oss:*'],
        Effect: 'Allow',
        Resource: ['acs:oss:*:*:*']
      }
    ],
    Version: '1'
  };

  const result = await stsClient.assumeRole(
    STS_ROLE,
    STSpolicy,
    3600 // STS过期时间，单位：秒。
  );
  const { credentials } = result;

  return credentials;
}

app.get('/sts', async (req, res) => {
  const credentials = await getToken();
  res.json(credentials);
});

console.log('server start at port: 8888');
app.listen(8888);
