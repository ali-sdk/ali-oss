import { checkBucketName } from '../utils/checkBucketName';
import { dataFix } from '../utils/dataFix';

export async function getBucketWorm(this: any, name: string, options) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'worm', options);
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
    status: result.status
  };
}
