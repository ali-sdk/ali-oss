const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;

proto.deleteBucketWebsite = async function deleteBucketWebsite(name, options) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
