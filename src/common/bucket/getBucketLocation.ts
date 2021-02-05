import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketLocationReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketLocation(this: Client, name: string, options: RequestOptions = {}): Promise<GetBucketLocationReturnType> {
  checkBucketName(name);
  name = name || this.options.bucket;
  const params = _bucketRequestParams('GET', name, 'location', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    location: result.data,
    res: result.res,
  };
}
