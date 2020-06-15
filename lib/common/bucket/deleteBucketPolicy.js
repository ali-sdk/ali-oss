const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
/**
 * deleteBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

proto.deleteBucketPolicy = async function deleteBucketPolicy(bucketName, options = {}) {
  _checkBucketName(bucketName);

  const params = this._bucketRequestParams('DELETE', bucketName, 'policy', options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res
  };
};
