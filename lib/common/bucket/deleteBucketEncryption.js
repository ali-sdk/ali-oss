const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');

const proto = exports;
// const jstoxml = require('jstoxml');
/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */

proto.deleteBucketEncryption = async function deleteBucketEncryption(bucketName) {
  _checkBucketName(bucketName);
  const params = this._bucketRequestParams('DELETE', bucketName, 'encryption');
  params.successStatuses = [204];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res
  };
};
