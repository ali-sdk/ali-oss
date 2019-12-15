const proto = exports;
// const jstoxml = require('jstoxml');
const obj2xml = require('../utils/obj2xml');
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

proto.putBucketEncryption = async function putBucketEncryption(bucketName, options) {
  options = options || {};
  this._checkBucketName(bucketName);
  const params = this._bucketRequestParams('PUT', bucketName, 'encryption', options);
  params.successStatuses = [200];
  // if (options.SSEAlgorithm !== 'AES256' && options.SSEAlgorithm !== 'KMS') {
  //   throw new Error('The Encryption request you specified is not valid. Supported value: AES256/KMS');
  // }
  // if (options.SSEAlgorithm === 'AES256' && options.KMSMasterKeyID !== undefined) {
  //   throw new Error('KMSMasterKeyID is not applicable if the default sse algorithm is not KMS');
  // }
  const paramXMLObj = {
    ServerSideEncryptionRule: {
      ApplyServerSideEncryptionByDefault: {
        SSEAlgorithm: options.SSEAlgorithm
      }
    }
  };
  if (options.KMSMasterKeyID !== undefined) {
    paramXMLObj.ServerSideEncryptionRule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID = options.KMSMasterKeyID;
  }
  const paramXML = obj2xml(paramXMLObj, {
    headers: true
  });
  params.mime = 'xml';
  params.content = paramXML;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res
  };
};
