import platform from 'platform';
import { _checkUserAgent } from './_checkUserAgent';
import { version } from '../../browser/version';
/*
 * Get User-Agent for browser & node.js
 * @example
 *   aliyun-sdk-nodejs/4.1.2 Node.js 5.3.0 on Darwin 64-bit
 *   aliyun-sdk-js/4.1.2 Safari 9.0 on Apple iPhone(iOS 9.2.1)
 *   aliyun-sdk-js/4.1.2 Chrome 43.0.2357.134 32-bit on Windows Server 2008 R2 / 7 64-bit
 */

export function _getUserAgent() {
  const agent = process && (process as any).browser ? 'js' : 'nodejs';
  const sdk = `aliyun-sdk-${agent}/${version}`;
  let plat = platform.description;
  if (!plat && process) {
    plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${
      process.arch
    }`;
  }

  return _checkUserAgent(`${sdk} ${plat}`);
}
