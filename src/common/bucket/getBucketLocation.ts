import { checkBucketName } from '../utils/checkBucketName';

export async function getBucketLocation(this: any, name: string, options: any = {}) {
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
