import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';

export async function deleteBucketCORS(
  this: any,
  name: string,
  options: RequestOptions = {}
):Promise<NormalSuccessResponse> {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'cors', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
