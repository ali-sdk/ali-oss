import { checkBucketName } from '../utils/checkBucketName';

export async function getBucketInfo(
  this: any,
  name: string,
  options: any = {}
) {
  checkBucketName(name);
  name = name || this.options.bucket;
  const params = this._bucketRequestParams('GET', name, 'bucketInfo', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    bucket: result.data.Bucket,
    res: result.res,
  };
}
