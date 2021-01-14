import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';

export async function deleteBucketLogging(
  this: any,
  name: string,
  options: RequestOptions = {}
): Promise<NormalSuccessResponse> {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'logging', options);
  params.successStatuses = [204, 200];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
