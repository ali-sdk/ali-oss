const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
/**
 * getBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

proto.getBucketPolicy = async function getBucketPolicy(bucketName, options = {}) {
  _checkBucketName(bucketName);

  const params = this._bucketRequestParams('GET', bucketName, 'policy', options);

  const result = await this.request(params);
  params.successStatuses = [200];
  let policy = null;

  if (result.res.status === 200) {
    policy = JSON.parse(result.res.data.toString());
  }

  return {
    policy,
    status: result.status,
    res: result.res
  };
};
