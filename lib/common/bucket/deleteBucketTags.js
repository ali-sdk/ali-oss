const proto = exports;
/**
 * deleteBucketTags
 * @param {String} name - object name
 * @param {Object} options
 */

proto.deleteBucketTags = async function deleteBucketTags(name, options = {}) {
  this._checkBucketName(name);
  options.subres = 'tagging';

  const params = this._bucketRequestParams('DELETE', name, options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res
  };
};
