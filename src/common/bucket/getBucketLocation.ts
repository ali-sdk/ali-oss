import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function getBucketLocation(this: any, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  name = name || this.options.bucket;
  const params = this._bucketRequestParams('GET', name, 'location', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    location: result.data,
    res: result.res,
  };
}
