import { checkBucketName } from '../utils/checkBucketName';
import { dataFix } from '../utils/dataFix';
import { RequestOptions } from '../../types/params';
import { GetBucketWormReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function getBucketWorm(
  this: Client,
  name: string,
  options: RequestOptions = {}
): Promise<GetBucketWormReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('GET', name, 'worm', options);
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = await this.request(params);
  dataFix(result.data, {
    lowerFirst: true,
    rename: {
      RetentionPeriodInDays: 'days'
    }
  });
  return {
    ...result.data,
    res: result.res,
    status: result.status,
  };
}
