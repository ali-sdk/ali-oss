import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketRequestPaymentReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

export async function getBucketRequestPayment(
  this: Client,
  bucketName: string,
  options: RequestOptions = {}
):Promise<GetBucketRequestPaymentReturnType> {
  checkBucketName(bucketName);
  const params = _bucketRequestParams(
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
