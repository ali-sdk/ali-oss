export function isDingTalk() {
  if (process.browser && window.navigator.userAgent.toLowerCase().includes('aliapp(dingtalk')) {
    return true;
  }
  return false;
}
