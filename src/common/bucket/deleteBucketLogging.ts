import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function deleteBucketLogging(
  this: Client,
  name: string,
  options: RequestOptions = {}
): Promise<NormalSuccessResponse> {
  checkBucketName(name);
  const params = _bucketRequestParams('DELETE', name, 'logging', options);
  params.successStatuses = [204, 200];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
