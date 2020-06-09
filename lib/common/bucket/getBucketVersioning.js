const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */

proto.getBucketVersioning = async function getBucketVersioning(bucketName, options) {
  _checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'versioning', options);
  params.xmlResponse = true;
  params.successStatuses = [200];
  const result = await this.request(params);

  const versionStatus = result.data.Status;
  return {
    status: result.status,
    versionStatus,
    res: result.res
  };
};
