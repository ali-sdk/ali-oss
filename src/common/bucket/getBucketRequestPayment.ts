import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketRequestPaymentReturnType } from '../../types/bucket';

/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function getBucketRequestPayment(
  this: any,
  bucketName: string,
  options: RequestOptions = {}
):Promise<GetBucketRequestPaymentReturnType> {
  checkBucketName(bucketName);
  const params = this._bucketRequestParams(
    'GET',
    bucketName,
    'requestPayment',
    options
  );
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res,
    payer: result.data.Payer,
  };
}
