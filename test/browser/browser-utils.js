const platform = require('platform');

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}-${new Date().valueOf()}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}/`;
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.cleanBucket = async function (store, bucket, multiversion) {
  store.useBucket(bucket);
  let result;
  const options = { versionId: null };

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

    await Promise.all(
      result[deleteKey].map(_ =>
        store.delete(_.name, multiversion ? Object.assign({}, options, { versionId: _.versionId }) : options)
      )
    );
  }
  await handleDelete('objects');
  if (multiversion) {
    await handleDelete('deleteMarker');
  }

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  await Promise.all(uploads.map(_ => store.abortMultipartUpload(_.name, _.uploadId)));

  const channels = (await store.listChannels()).channels.map(_ => _.Name);
  await Promise.all(channels.map(_ => store.deleteChannel(_)));
  await store.deleteBucket(bucket);
};

exports.sleep = function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
