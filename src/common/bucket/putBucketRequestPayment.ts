import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { RequestOptions } from '../../types/params';

/**
 * putBucketRequestPayment
 * @param {String} bucketName
 * @param {String} payer
 * @param {Object} options
 */
const payerAll = ['BucketOwner', 'Requester'];

export async function putBucketRequestPayment(this: any, bucketName: string, payer: 'BucketOwner' | 'Requester', options: RequestOptions = {}) {
  if (!payer || payerAll.indexOf(payer) < 0) {
    throw new Error('payer must be BucketOwner or Requester');
  }

  checkBucketName(bucketName);
  const params = this._bucketRequestParams(
    'PUT',
    bucketName,
    'requestPayment',
    options
  );
  params.successStatuses = [200];

  const paramXMLObj = {
    RequestPaymentConfiguration: {
      Payer: payer
    }
  };
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
}
