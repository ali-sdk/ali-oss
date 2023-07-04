/* eslint-disable no-console */
const utils = require('./utils');
const config = require('../config').oss;
const OSS = require('../..');

const store = new OSS(config);
// const interval = new Date().getTime() - 24 * 60 * 60 * 1 * 1000;
// const calculateData = bucket => {
//   return parseInt(bucket.split('-').pop());
// };

store.listBuckets().then(async r => {
  const bucketList = [];
  r.buckets.forEach(i => {
    if (i.name.indexOf('ali-oss-') === 0) {
      bucketList.push({
        bucket: i.name,
        region: i.region
      });
    }
  });

  for (const bucketListItem of bucketList) {
    console.log(`Cleaning up : ${bucketListItem.bucket}`);
    store.options.endpoint.parse(`https://${bucketListItem.region}.aliyuncs.com`);
    const client = new OSS({
      ...store.options,
      bucket: bucketListItem.bucket,
      region: bucketListItem.region
    });
    try {
      // eslint-disable-next-line no-await-in-loop
      await utils.cleanBucket(client, bucketListItem.bucket);
    } catch (e) {
      console.log('bucket name =======>', bucketListItem.bucket);
      console.log('error:====>', e);
    }
  }
});
