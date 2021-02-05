import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { Client } from '../../setConfig';

export async function putBucketReferer(
  this: Client,
  name: string,
  allowEmpty: boolean,
  referers: string[] | null,
  options: RequestOptions = {}
): Promise<NormalSuccessResponse> {
  checkBucketName(name);
  const params = _bucketRequestParams('PUT', name, 'referer', options);
  const parseXMLObj = {
    RefererConfiguration: {
      AllowEmptyReferer: allowEmpty ? 'true' : 'false',
      RefererList:
        referers && referers.length > 0
          ? {
            Referer: referers,
          }
          : '',
    },
  };
  params.content = obj2xml(parseXMLObj);
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
