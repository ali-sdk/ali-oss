export function checkEnv(msg: string) {
  if (process.browser) {
    console.warn(msg);
  }
}
