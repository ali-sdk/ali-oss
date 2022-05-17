interface Process {
  browser: boolean;
}

declare let process: Process;

export function checkEnv(msg: string) {
  if (process.browser) {
    console.warn(msg);
  }
}
