var express = require('express');
var STS = require('ali-oss').STS;
var co = require('co');
var fs = require('fs');
var app = express();
var path = require('path');
var conf = require('./config');

app.get('/sts', function (req, res) {
  console.log(conf);
  var policy;
  if (conf.PolicyFile) {
    policy = fs.readFileSync(path.resolve(__dirname, conf.PolicyFile)).toString('utf-8')
  }

  var client = new STS({
    accessKeyId: conf.AccessKeyId,
    accessKeySecret: conf.AccessKeySecret,
  });

  co(function* () {
    var result = yield client.assumeRole(conf.RoleArn, policy, conf.TokenExpireTime);
    console.log(result);

    // res.set('Access-Control-Allow-Origin', '*');
    // res.set('Access-Control-Allow-METHOD', 'GET');
    res.json({
      AccessKeyId: result.credentials.AccessKeyId,
      AccessKeySecret: result.credentials.AccessKeySecret,
      SecurityToken: result.credentials.SecurityToken,
      Expiration: result.credentials.Expiration
    });
  }).then(function () {
    // pass
  }).catch(function (err) {
    console.log(err);
    res.status(400).json(err.message);
  });
});

app.use('/static', express.static('public'))
app.get('/', function(req, res){
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

app.listen(3000, function () {
  console.log('App started.');
});
