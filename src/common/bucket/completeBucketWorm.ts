import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function completeBucketWorm(this: any, name: string, wormId: string, options: RequestOptions = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('POST', name, { wormId }, options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
