
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
  if (err) throw err;
  client.get('package.json', function (err, data) {
    if (err) throw err;
    console.log(data.toString());
    client.remove('package.json', function (err, data) {
      if (err) throw err;
    });
  });
});
