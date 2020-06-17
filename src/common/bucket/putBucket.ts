import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';

export async function putBucket(this: any, name: string, options: any = {}) {
  checkBucketName(name, true);
  options = options || {};
  const params = this._bucketRequestParams('PUT', name, '', options);

  const CreateBucketConfiguration: any = {};
  const paramlXMLObJ = {
    CreateBucketConfiguration
  };

  if (options.StorageClass) {
    CreateBucketConfiguration.StorageClass = options.StorageClass;
    params.mime = 'xml';
    params.content = obj2xml(paramlXMLObJ, { headers: true });
  }

  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    bucket: (result.headers.location && result.headers.location.substring(1)) || null,
    res: result.res
  };
};
