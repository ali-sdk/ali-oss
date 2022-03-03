const mime = require('mime');
const path = require('path');

export function checkUA(params) {
  if (
    process.browser &&
    !mime.getType(params.mime || path.extname(params.object || '')) &&
    window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')
  ) {
    return true;
  }
  return false;
}
