const { env } = process;
const oss = require('.');
const pkg = require('./package.json');
const check = require('./publish-check');

const store = oss({
  accessKeyId: env.ALI_SDK_OSS_CDN_ID,
  accessKeySecret: env.ALI_SDK_OSS_CDN_SECRET,
  endpoint: env.ALI_SDK_OSS_CDN_ENDPOINT,
  bucket: env.ALI_SDK_OSS_CDN_BUCKET
});

const current = `aliyun-oss-sdk-${pkg.version}.min.js`;
const dist = './dist/aliyun-oss-sdk.min.js';

async function checkFile() {
  try {
    check.checkDist(dist); // check file exist
    const contentMd5 = await check.caculateFileMd5(dist); // check md5 to server
    await store.put(current, dist, {
      headers: {
        'Content-Md5': contentMd5
      }
    });
    await check.checkCDNFile(current, store); // check cdn file
    console.log(`publish CDN success, version is ${pkg.version}`);
  } catch (e) {
    console.log(e);
  }
}

checkFile();
