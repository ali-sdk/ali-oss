
const platform = require('platform');

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}/`;
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.cleanBucket = async function (store, bucket, multiversion) {
  store.useBucket(bucket);
  let result;
  const subres = {};
  const options = { subres };

  if (!multiversion) {
    try {
      await store.getBucketVersions({
        'max-keys': 1000
      });
      multiversion = true;
    } catch (error) {
      multiversion = false;
    }
  }

  async function handleDelete(deleteKey) {
    if (multiversion) {
      result = await store.getBucketVersions({
        'max-keys': 1000
      });
    } else {
      result = await store.list({
        'max-keys': 1000
      });
    }
    result[deleteKey] = result[deleteKey] || [];
    for (let i = 0; i < result[deleteKey].length; i++) {
      const obj = result[deleteKey][i];
      if (multiversion) {
        subres.versionId = obj.versionId;
      }
      await store.delete(obj.name, options);
    }
  }
  await handleDelete('objects');
  if (multiversion) {
    await handleDelete('deleteMarker');
  }

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  /* eslint no-await-in-loop: [0] */
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    await store.abortMultipartUpload(up.name, up.uploadId);
  }
  await store.deleteBucket(bucket);
};

exports.sleep = function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
