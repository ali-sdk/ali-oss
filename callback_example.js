
var Oss = require('./');
var co = require('co');
var fs = require('fs');

var client = Oss.create({
  bucket: 'node-ali-oss',
  accessKeyId: 'iAeyzYXtZAdM8V2V',
  accessKeySecret: 'AmieMAD5ZYuevL3UNrkeORzQ0cvqrO'
});

client.upload = co(client.upload);
client.get = co(client.get);
client.remove = co(client.remove);


client.upload('./package.json', 'package.json', function (err, data) {
  console.log(err, data);
});
