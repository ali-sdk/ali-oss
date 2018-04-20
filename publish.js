const env = process.env;
const oss = require('.');
const co = require('co');
const pkg = require('./package.json');
const check = require('./publish-check');

const store = oss({
  accessKeyId: env.ALI_SDK_OSS_CDN_ID,
  accessKeySecret: env.ALI_SDK_OSS_CDN_SECRET,
  endpoint: env.ALI_SDK_OSS_CDN_ENDPOINT,
  bucket: env.ALI_SDK_OSS_CDN_BUCKET,
});

const current = `aliyun-oss-sdk-${pkg.version}.min.js`;
const dist = './dist/aliyun-oss-sdk.min.js';

co(function* () {
  check.checkDist(dist); // check file exist
  yield store.put(current, dist);
  yield check.checkCDNFile(current, store);// check cdn file
  console.log('publish cdn success');
}).catch((err) => {
  console.log(err);
});
