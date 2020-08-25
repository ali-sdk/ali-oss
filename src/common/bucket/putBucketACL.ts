import { checkBucketName } from '../utils/checkBucketName';
import { ACLType, RequestOptions } from '../../types/params';

export async function putBucketACL(
  this: any,
  name: string,
  acl: ACLType,
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'acl', options);
  params.headers = {
    'x-oss-acl': acl,
  };
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    bucket:
      (result.headers.location && result.headers.location.substring(1)) || null,
    res: result.res,
  };
}
