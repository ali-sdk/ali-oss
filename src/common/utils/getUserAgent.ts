import platform from 'platform';
import { version } from '../../browser/version';
import { checkUserAgent } from './checkUserAgent';

export const getUserAgent = () => {
  const agent = (process && (process as any).browser) ? 'js' : 'nodejs';
  const sdk = `aliyun-sdk-${agent}/${version}`;
  let plat = platform.description;
  if (!plat && process) {
    plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
  }

  return checkUserAgent(`${sdk} ${plat}`);
};

