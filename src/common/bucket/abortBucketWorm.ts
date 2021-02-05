import { checkBucketName } from '../utils/checkBucketName';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';

export async function abortBucketWorm(this: Client, name: string, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
  checkBucketName(name);
  const params = _bucketRequestParams('DELETE', name, 'worm', options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
