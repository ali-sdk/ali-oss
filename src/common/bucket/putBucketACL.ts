import { checkBucketName } from '../utils/checkBucketName';
import { ACLType, RequestOptions } from '../../types/params';
import { PutBucketACLReturnType } from '../../types/bucket';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function putBucketACL(
  this: Client,
  name: string,
  acl: ACLType,
  options: RequestOptions = {}
): Promise<PutBucketACLReturnType> {
  checkBucketName(name);
  const params = _bucketRequestParams('PUT', name, 'acl', options);
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
