const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
/**
 * deleteBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 */

proto.deleteBucketTags = async function deleteBucketTags(name, options = {}) {
  _checkBucketName(name);

  const params = this._bucketRequestParams('DELETE', name, 'tagging', options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res
  };
};
