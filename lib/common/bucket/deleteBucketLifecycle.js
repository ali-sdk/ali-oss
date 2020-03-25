const proto = exports;

proto.deleteBucketLifecycle = async function deleteBucketLifecycle(name, options) {
  this._checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'lifecycle', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
