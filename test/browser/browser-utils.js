'use strict';

const platform = require('platform');

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}/`;
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.cleanBucket = async function cleanBucket(store, bucket, region) {
  store.useBucket(bucket, region);
  let result = await store.list({
    'max-keys': 1000,
  });
  result.objects = result.objects || [];
  for (let i = 0; i < result.objects.length; i++) {
    const obj = result.objects[i];
    await store.delete(obj.name);
  }

  result = await store.listUploads({
    'max-uploads': 1000,
  });
  const uploads = result.uploads || [];
  /* eslint no-await-in-loop: [0] */
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    await store.abortMultipartUpload(up.name, up.uploadId);
  }
  await store.deleteBucket(bucket, region);
};

exports.sleep = function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
