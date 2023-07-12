const { isArray } = require('./utils/isArray');

const proto = exports;

proto._parallelNode = async function _parallelNode(todo, parallel, fn, sourceData) {
  const that = this;
  // upload in parallel
  const jobErr = [];
  let jobs = [];
  const tempBatch = todo.length / parallel;
  const remainder = todo.length % parallel;
  const batch = remainder === 0 ? tempBatch : (todo.length - remainder) / parallel + 1;
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

    if (jobs.length === parallel || (taskIndex === batch && i === todo.length - 1)) {
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

proto._parallel = function _parallel(todo, parallel, jobPromise) {
  const that = this;
  return new Promise(resolve => {
    const _jobErr = [];
    if (parallel <= 0 || !todo) {
      resolve(_jobErr);
      return;
    }

    function onlyOnce(fn) {
      return function (...args) {
        if (fn === null) throw new Error('Callback was already called.');
        const callFn = fn;
        fn = null;
        callFn.apply(this, args);
      };
    }

    function createArrayIterator(coll) {
      let i = -1;
      const len = coll.length;
      return function next() {
        return ++i < len && !that.isCancel() ? { value: coll[i], key: i } : null;
      };
    }

    const nextElem = createArrayIterator(todo);
    let done = false;
    let running = 0;
    let looping = false;

    function iterateeCallback(err) {
      running -= 1;
      if (err) {
        done = true;
        _jobErr.push(err);
        resolve(_jobErr);
      } else if (done && running <= 0) {
        done = true;
        resolve(_jobErr);
      } else if (!looping) {
        /* eslint no-use-before-define: [0] */
        if (that.isCancel()) {
          resolve(_jobErr);
        } else {
          replenish();
        }
      }
    }

    function iteratee(value, callback) {
      jobPromise(value)
        .then(result => {
          callback(null, result);
        })
        .catch(err => {
          callback(err);
        });
    }

    function replenish() {
      looping = true;
      while (running < parallel && !done && !that.isCancel()) {
        const elem = nextElem();
        if (elem === null || _jobErr.length > 0) {
          done = true;
          if (running <= 0) {
            resolve(_jobErr);
          }
          return;
        }
        running += 1;
        iteratee(elem.value, onlyOnce(iterateeCallback));
      }
      looping = false;
    }

    replenish();
  });
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

  if (isArray(this.multipartUploadStreams)) {
    this.multipartUploadStreams.forEach(_ => {
      if (_.destroyed === false) {
        const err = {
          name: 'cancel',
          message: 'cancel'
        };
        _.destroy(err);
      }
    });
  }
  this.multipartUploadStreams = [];
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

// cancel is not error , so create an object
proto._makeCancelEvent = function _makeCancelEvent() {
  const cancelEvent = {
    status: 0,
    name: 'cancel'
  };
  return cancelEvent;
};

// abort is not error , so create an object
proto._makeAbortEvent = function _makeAbortEvent() {
  const abortEvent = {
    status: 0,
    name: 'abort',
    message: 'upload task has been abort'
  };
  return abortEvent;
};
