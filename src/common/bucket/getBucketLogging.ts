import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { GetBucketLoggingReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketLogging(
  this: Client,
  name: string,
  options: RequestOptions = {}
):Promise<GetBucketLoggingReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('GET', name, 'logging', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const enable = result.data.LoggingEnabled;
  return {
    enable: !!enable,
    prefix: (enable && enable.TargetPrefix) || null,
    res: result.res,
  };
}
