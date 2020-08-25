import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { RequestOptions } from '../../types/params';

export async function putBucketLogging(
  this: any,
  name: string,
  prefix = '',
  options: RequestOptions = {}
) {
  checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'logging', options);
  const parseXMLObj = {
    BucketLoggingStatus: {
      LoggingEnabled: {
        TargetBucket: name,
        TargetPrefix: prefix,
      },
    },
  };

  params.content = obj2xml(parseXMLObj, { headers: true });
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
