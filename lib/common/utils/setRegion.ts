import urlutil from 'url';
import { checkConfigValid } from './checkConfigValid';

export function setRegion(region: string, internal = false, secure = false) {
  checkConfigValid(region, 'region');
  const protocol = secure ? 'https://' : 'http://';
  let suffix = internal ? '-internal.aliyuncs.com' : '.aliyuncs.com';
  const prefix = 'vpc100-oss-cn-';
  // aliyun VPC region: https://help.aliyun.com/knowledge_detail/38740.html
  if (region.substr(0, prefix.length) === prefix) {
    suffix = '.aliyuncs.com';
  }

  return urlutil.parse(protocol + region + suffix);
}
