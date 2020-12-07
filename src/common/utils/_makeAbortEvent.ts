export function _makeAbortEvent() {
  const abortEvent = {
    status: 0,
    name: 'abort',
    message: 'upload task has been abort'
  };
  return abortEvent;
}
