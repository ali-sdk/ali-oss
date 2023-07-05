/* eslint-disable no-console */
const utils = require('./utils');
const { oss: config } = require('../config');
const OSS = require('../..');

const store = new OSS(config);
const limit = 50;

store.listBuckets().then(r => {
  const bucketList = [];
  r.buckets.forEach(i => {
    if (i.name.indexOf('ali-oss-') === 0) {
      bucketList.push({
        bucket: i.name,
        region: i.region
      });
    }
  });
  const proDelete = async () => {
    const list = bucketList.splice(0, limit);
    const pros = [];
    for (const bucketListItem of list) {
      console.log(`Cleaning up : ${bucketListItem.bucket}`);
      const client = new OSS({
        ...store.options,
        endpoint: `https://${bucketListItem.region}.aliyuncs.com`,
        bucket: bucketListItem.bucket,
        region: bucketListItem.region,
        maxSocket: 50
      });
      try {
        const delRes = utils.cleanBucket(client, bucketListItem.bucket);
        pros.push(delRes);
      } catch (e) {
        console.log('bucket name =======>', bucketListItem.bucket);
        console.log('error:====>', e);
      }
    }
    await Promise.all(pros);
    if (bucketList.length > 0) await proDelete();
  };
  proDelete();
});

// const interval = new Date().getTime() - 24 * 60 * 60 * 1 * 1000;
// const calculateData = bucket => {
//   return parseInt(bucket.split('-').pop());
// };
