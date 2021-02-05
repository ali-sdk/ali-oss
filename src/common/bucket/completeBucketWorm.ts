import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function completeBucketWorm(this: Client, name: string, wormId: string, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
  checkBucketName(name);
  const params = _bucketRequestParams('POST', name, { wormId }, options);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
