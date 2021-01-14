import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { isArray } from '../utils/isArray';
import { NormalSuccessResponse, RequestOptions } from '../../types/params';
import { PutBucketWebsiteConfigType } from '../../types/bucket';

export async function putBucketWebsite(
  this: any,
  name: string,
  config: PutBucketWebsiteConfigType = { index: 'index.html' },
  options: RequestOptions = {}
): Promise<NormalSuccessResponse> {
  checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'website', options);
  const IndexDocument: any = {
    Suffix: config.index || 'index.html',
  };
  const WebsiteConfiguration: any = {
    IndexDocument,
  };
  let website: any = {
    WebsiteConfiguration,
  };

  if (config.supportSubDir) {
    IndexDocument.SupportSubDir = config.supportSubDir;
  }

  if (config.type) {
    IndexDocument.Type = config.type;
  }

  if (config.error) {
    WebsiteConfiguration.ErrorDocument = {
      Key: config.error,
    };
  }

  if (config.routingRules !== undefined) {
    if (!isArray(config.routingRules)) {
      throw new Error('RoutingRules must be Array');
    }
    WebsiteConfiguration.RoutingRules = {
      RoutingRule: config.routingRules,
    };
  }

  website = obj2xml(website);
  params.content = website;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res,
  };
}
