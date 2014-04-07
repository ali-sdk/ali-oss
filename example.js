
var Oss = require('./');
var co = require('co');

var client = Oss.create({
  bucket: 'node-ali-oss',
  accessKeyId: 'iAeyzYXtZAdM8V2V',
  accessKeySecret: 'AmieMAD5ZYuevL3UNrkeORzQ0cvqrO'
});

co(function* () {
  yield client.upload('./package.json', 'package.json');
})();
