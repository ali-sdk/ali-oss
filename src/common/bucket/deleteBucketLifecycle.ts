import { checkBucketName } from '../utils/checkBucketName';

export async function deleteBucketLifecycle(
  this: any,
  name,
  options: any = {}
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
