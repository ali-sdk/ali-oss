import { obj2xml } from '../utils/obj2xml';
import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { InitiateBucketWormReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function initiateBucketWorm(
  this: Client,
  name: string,
  days: string | number,
  options: RequestOptions = {}
): Promise<InitiateBucketWormReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('POST', name, 'worm', options);
  const paramlXMLObJ = {
    InitiateWormConfiguration: {
      RetentionPeriodInDays: days,
    },
  };

  params.mime = 'xml';
  params.content = obj2xml(paramlXMLObJ, { headers: true });
  params.successStatuses = [200];

  const result = await this.request(params);
  return {
    res: result.res,
    wormId: result.res.headers['x-oss-worm-id'],
    status: result.status,
  };
}
