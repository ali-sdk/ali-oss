const express = require('express');
const { STS } = require('ali-oss');
const co = require('co');
const fs = require('fs');

const app = express();
const path = require('path');
const conf = require('./config');

app.get('/sts', (req, res) => {
  console.log(conf);
  let policy;
  if (conf.PolicyFile) {
    policy = fs.readFileSync(path.resolve(__dirname, conf.PolicyFile)).toString('utf-8');
  }

  const client = new STS({
    accessKeyId: conf.AccessKeyId,
    accessKeySecret: conf.AccessKeySecret
  });

  co(function* () {
    const result = yield client.assumeRole(conf.RoleArn, policy, conf.TokenExpireTime);
    console.log(result);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-METHOD', 'GET');
    res.json({
      AccessKeyId: result.credentials.AccessKeyId,
      AccessKeySecret: result.credentials.AccessKeySecret,
      SecurityToken: result.credentials.SecurityToken,
      Expiration: result.credentials.Expiration
    });
  }).then(() => {
    // pass
  }).catch((err) => {
    console.log(err);
    res.status(400).json(err.message);
  });
});

app.use('/static', express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

app.listen(9000, () => {
  console.log('App started.');
});
