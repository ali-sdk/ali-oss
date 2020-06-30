import platform from 'platform';

export function _unSupportBrowserTip() {
  const { name, version } = platform;
  if (name && name.toLowerCase && name.toLowerCase() === 'ie' && version.split('.')[0] < 10) {
    console.warn('ali-oss does not support the current browser');
  }
}