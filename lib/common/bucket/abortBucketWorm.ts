import { checkBucketName } from '../utils/checkBucketName';

export async function abortBucketWorm(this: any, name: string, options) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'worm', options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
