export function checkBrowserEnv(msg: string) {
  if (process.browser) {
    console.warn(msg);
  }
}
