import { obj2xml } from '../utils/obj2xml';
import { checkBucketName } from '../utils/checkBucketName';

export async function initiateBucketWorm(
  this: any,
  name: string,
  days: string,
  options
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('POST', name, 'worm', options);
  const paramlXMLObJ = {
    InitiateWormConfiguration: {
      RetentionPeriodInDays: days
    }
  };

  params.mime = 'xml';
  params.content = obj2xml(paramlXMLObJ, { headers: true });
  params.successStatuses = [200];

  const result = await this.request(params);
  return {
    res: result.res,
    wormId: result.res.headers['x-oss-worm-id'],
    status: result.status
  };
}
