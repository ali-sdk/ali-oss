import { checkBucketName } from '../utils/checkBucketName';

export  async function deleteBucketWebsite(this: any, name, options: any = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
