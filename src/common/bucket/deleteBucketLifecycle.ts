import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function deleteBucketLifecycle(
  this: any,
  name: string,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams(
    'DELETE',
    name,
    'lifecycle',
    options
  );
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
