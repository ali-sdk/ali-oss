const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */

proto.getBucketEncryption = async function getBucketEncryption(bucketName) {
  _checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'encryption');
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const encryption = result.data.ApplyServerSideEncryptionByDefault;
  return {
    encryption,
    status: result.status,
    res: result.res
  };
};
