const { env } = process;
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
  const contentMd5 = yield check.caculateFileMd5(dist); // check md5 to server
  yield store.put(current, dist, {
    headers: {
      'Content-Md5': contentMd5,
    },
  });
  yield check.checkCDNFile(current, store);// check cdn file
  console.log(`publish CDN success, version is ${pkg.version}`);
}).catch((err) => {
  console.log(err);
});
