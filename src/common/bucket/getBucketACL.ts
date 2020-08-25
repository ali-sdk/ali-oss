import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';

export async function getBucketACL(this: any, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'acl', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName,
    },
    res: result.res,
  };
}
