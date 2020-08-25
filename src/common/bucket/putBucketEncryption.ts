import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { PutBucketEncryptionOptions } from '../../types/params';
/**
 * putBucketEncryption
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function putBucketEncryption(
  this: any,
  bucketName: string,
  options: PutBucketEncryptionOptions
) {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams(
    'PUT',
    bucketName,
    'encryption',
    options
  );
  params.successStatuses = [200];
  const paramXMLObj: any = {
    ServerSideEncryptionRule: {
      ApplyServerSideEncryptionByDefault: {
        SSEAlgorithm: options.SSEAlgorithm,
      },
    },
  };
  if (options.KMSMasterKeyID !== undefined) {
    paramXMLObj.ServerSideEncryptionRule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID =
      options.KMSMasterKeyID;
  }
  const paramXML = obj2xml(paramXMLObj, {
    headers: true,
  });
  params.mime = 'xml';
  params.content = paramXML;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
