export function resetCancelFlag(this: any) {
  this.options.multipartRunning = true;
  this.options.cancelFlag = false;
}
