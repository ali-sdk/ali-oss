const utils = require('./utils');
const config = require('../config').oss;
const OSS = require('../..');

const store = new OSS(config);
const interval = new Date().getTime() - 24 * 60 * 60 * 1 * 1000;

store.listBuckets().then(r => {
  const bucketList = [];
  r.buckets.forEach(i => {
    if (i.name.indexOf('ali-oss') === 0) {
      if (calculateData(i.name) < interval) {
        bucketList.push({
          bucket: i.name,
          region: i.region
        });
      }
    }
  });

  for (const bucketListItem of bucketList) {
    const client = new OSS({
      ...store.options,
      bucket: bucketListItem.bucket,
      region: bucketListItem.region
    });
    utils.cleanBucket(client, bucketListItem.bucket).catch(e => {
      console.log('bucket name =======>', bucketListItem.bucket);
      console.log('error:====>', e);
    });
  }
});

const calculateData = bucket => {
  return parseInt(bucket.split('-').pop());
};
