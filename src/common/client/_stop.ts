export function _stop(this: any) {
  this.options.cancelFlag = true;
  this.options.multipartRunning = false;
}
