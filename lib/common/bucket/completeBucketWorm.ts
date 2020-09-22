import { checkBucketName } from '../utils/checkBucketName';

export async function completeBucketWorm(this: any, name: string, wormId: string, options) {
  checkBucketName(name);
  const params = this._bucketRequestParams('POST', name, { wormId }, options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
