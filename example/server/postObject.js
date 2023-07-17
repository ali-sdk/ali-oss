const express = require('express');
const OSS = require('../../');
const { STS } = require('../../');

const app = express();
const path = require('path');

const config = {
  accessKeyId: 'accessKeyId',
  accessKeySecret: 'accessKeySecret',
  bucket: 'bucket'
};

const STS_ROLE = 'STS_ROLE';

app.get('/postObject', async (req, res) => {
  const client = new OSS(config);

  const date = new Date();
  date.setDate(date.getDate() + 1);
  const policy = {
    expiration: date.toISOString(), // 请求有效期
    conditions: [
      ['content-length-range', 0, 1048576000] // 设置上传文件的大小限制
      // { bucket: client.options.bucket } // 限制可上传的bucket
    ]
  };

  const formData = await client.calculatePostSignature(policy);
  const url = `http://${config.bucket}.${(await client.getBucketLocation()).location}.aliyuncs.com`;
  const params = {
    formData,
    url
  };

  res.json(params);
});
app.get('/postObjectBySTS', async (req, res) => {
  if (STS_ROLE === 'STS_ROLE') {
    res.status(500);
    res.json({
      message: '请修改 STS_ROLE '
    });
  }
  const stsClient = new STS(config);

  const date = new Date();
  date.setDate(date.getDate() + 1);
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

  const formData = {};
  try {
    const result = await stsClient.assumeRole(
      STS_ROLE,
      STSpolicy,
      3600 // token过期时间 单位秒
    );
    const { credentials } = result;

    const client = new OSS({
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      bucket: config.bucket,
      stsToken: credentials.SecurityToken
    });

    const policy = {
      expiration: date.toISOString(), // 请求有效期
      conditions: [
        ['content-length-range', 0, 1048576000] // 设置上传文件的大小限制
        // { bucket: client.options.bucket } // 限制可上传的bucket
      ]
    };

    const signatureFormData = await client.calculatePostSignature(policy);
    Object.assign(formData, signatureFormData);
    formData['x-oss-security-token'] = credentials.SecurityToken;
    const url = `http://${config.bucket}.${(await client.getBucketLocation()).location}.aliyuncs.com`;
    const params = {
      formData,
      url
    };

    res.json(params);
  } catch (error) {
    res.status(500);
    res.json(error);
  }
});

app.use('/static', express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../src/template/postObject.html'));
});

app.listen(9000, () => {
  console.log('http://localhost:9000');
  console.log('App of postObject started.');
});
