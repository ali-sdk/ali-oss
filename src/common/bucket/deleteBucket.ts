import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function deleteBucket(this: any, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, '', options);
  const result = await this.request(params);
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res,
    };
  }
  throw await this.requestError(result);
}
