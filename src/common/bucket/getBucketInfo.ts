import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketInfoReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketInfo(
  this: Client,
  name: string,
  options: RequestOptions = {}
): Promise<GetBucketInfoReturnType> {
  checkBucketName(name);
  name = name || this.options.bucket;
  const params = _bucketRequestParams('GET', name, 'bucketInfo', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    bucket: result.data.Bucket,
    res: result.res,
  };
}
