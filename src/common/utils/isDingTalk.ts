import mime from 'mime';
import path from 'path';

interface Process {
  browser: boolean;
}

declare let process: Process;

export function isDingTalk(params) {
  if (
    process.browser &&
    !mime.getType(params.mime || path.extname(params.object || '')) &&
    window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')
  ) {
    return true;
  }
  return false;
}
