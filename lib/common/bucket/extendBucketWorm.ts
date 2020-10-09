import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';

export async function extendBucketWorm(this: any, name: string, wormId: string, days: string | number, options) {
  checkBucketName(name);
  const params = this._bucketRequestParams('POST', name, { wormExtend: '', wormId }, options);
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
