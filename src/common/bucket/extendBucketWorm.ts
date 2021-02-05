import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function extendBucketWorm(this: Client, name: string, wormId: string, days: string | number, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
  checkBucketName(name);
  const params = _bucketRequestParams('POST', name, { wormExtend: '', wormId }, options);
  const paramlXMLObJ = {
    ExtendWormConfiguration: {
      RetentionPeriodInDays: days
    }
  };

  params.mime = 'xml';
  params.content = obj2xml(paramlXMLObJ, { headers: true });
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
