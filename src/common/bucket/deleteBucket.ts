import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { DeleteBucketReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function deleteBucket(this: Client, name: string, options: RequestOptions = {}): Promise<DeleteBucketReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('DELETE', name, '', options);
  const result = await this.request(params);
  if (result.status === 200 || result.status === 204) {
    return {
      res: result.res,
    };
  }
  throw await this.requestError(result);
}
