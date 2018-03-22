
const proto = exports;

proto._parallelNode = async function _parallelNode(todo, parallel, fn, sourceData) {
  const that = this;
  // upload in parallel
  const jobErr = [];
  let jobs = [];
  const tempBatch = todo.length / parallel;
  const remainder = todo.length % parallel;
  const batch = remainder === 0 ? tempBatch : ((todo.length - remainder) / parallel) + 1;
  let taskIndex = 1;
  for (let i = 0; i < todo.length; i++) {
    if (that.isCancel()) {
      break;
    }

    if (sourceData) {
      jobs.push(fn(that, todo[i], sourceData));
    } else {
      jobs.push(fn(that, todo[i]));
    }

    if (jobs.length === parallel || (taskIndex === batch && i === (todo.length - 1))) {
      try {
        taskIndex += 1;
        /* eslint no-await-in-loop: [0] */
        await Promise.all(jobs);
      } catch (err) {
        jobErr.push(err);
      }
      jobs = [];
    }
  }

  return jobErr;
};

/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
proto.cancel = function cancel(abort) {
  this.options.cancelFlag = true;
  if (abort) {
    this.abortMultipartUpload(abort.name, abort.uploadId, abort.options);
  }
};

proto.isCancel = function isCancel() {
  return this.options.cancelFlag;
};

proto.resetCancelFlag = function resetCancelFlag() {
  this.options.cancelFlag = false;
};

proto._stop = function _stop() {
  this.options.cancelFlag = true;
};
