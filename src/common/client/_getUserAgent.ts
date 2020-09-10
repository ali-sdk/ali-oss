import platform from 'platform';
import { version } from '../../browser/version';
import { _checkUserAgent } from './_checkUserAgent';

export function _getUserAgent() {
  const agent = (process && (process as any).browser) ? 'js' : 'nodejs';
  const sdk = `aliyun-sdk-${agent}/${version}`;
  let plat = platform.description;
  if (!plat && process) {
    plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
  }

  return _checkUserAgent(`${sdk} ${plat}`);
}
