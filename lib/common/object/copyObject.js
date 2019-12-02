const proto = exports;

proto.copy = async function copy(name, sourceName, bucketName, options) {
  if (typeof bucketName === 'object') {
    options = bucketName; // 兼容旧版本，旧版本第三个参数为options
  }
  options = options || {};
  options.headers = options.headers || {};

  Object.keys(options.headers).forEach((key) => {
    options.headers[`x-oss-copy-source-${key.toLowerCase()}`] = options.headers[key];
  });
  if (options.meta) {
    options.headers['x-oss-metadata-directive'] = 'REPLACE';
  }
  this._convertMetaToHeaders(options.meta, options.headers);

  sourceName = this._getSourceName(sourceName, bucketName);

  options.headers['x-oss-copy-source'] = sourceName;

  const params = this._objectRequestParams('PUT', name, options);
  params.xmlResponse = true;
  params.successStatuses = [200, 304];

  const result = await this.request(params);

  let { data } = result;
  if (data) {
    data = {
      etag: data.ETag,
      lastModified: data.LastModified
    };
  }

  return {
    data,
    res: result.res
  };
};

// todo delete
proto._getSourceName = function _getSourceName(sourceName, bucketName) {
  if (typeof bucketName === 'string') {
    sourceName = this._objectName(sourceName);
  } else if (sourceName[0] !== '/') {
    bucketName = this.options.bucket;
  } else {
    bucketName = sourceName.replace(/\/(.+?)(\/.*)/, '$1');
    sourceName = sourceName.replace(/(\/.+?\/)(.*)/, '$2');
  }

  this._checkBucketName(bucketName);

  sourceName = `/${bucketName}/${encodeURIComponent(sourceName)}`;
  return sourceName;
};
