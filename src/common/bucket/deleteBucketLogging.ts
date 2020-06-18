import { checkBucketName } from "../utils/checkBucketName";

export async function deleteBucketLogging(this: any, name: string, options: any = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'logging', options);
  params.successStatuses = [204, 200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
