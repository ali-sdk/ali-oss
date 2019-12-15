const proto = exports;
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */

proto.getBucketEncryption = async function getBucketEncryption(bucketName) {
  this._checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'encryption');
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const encryptions = result.data.ApplyServerSideEncryptionByDefault;
  return {
    encryptions,
    status: result.status,
    res: result.res
  };
};
