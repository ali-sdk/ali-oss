var env = process.env;
var oss = require('.');
var co = require('co');
var pkg = require('./package.json');

var store = oss({
  accessKeyId: env.ALI_SDK_OSS_CDN_ID,
  accessKeySecret: env.ALI_SDK_OSS_CDN_SECRET,
  endpoint: env.ALI_SDK_OSS_CDN_ENDPOINT,
  bucket: env.ALI_SDK_OSS_CDN_BUCKET,
});

var latest = 'aliyun-oss-sdk.min.js';
var current = 'aliyun-oss-sdk-' + pkg.version + '.min.js';
var dist = './dist/aliyun-oss-sdk.min.js';

co(function* () {
  yield store.put(latest, dist);
  yield store.put(current, dist);
}).catch(function (err) {
  console.log(err);
});
