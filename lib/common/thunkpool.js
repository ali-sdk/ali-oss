

const co = require('co');
const Queue = require('co-priority-queue');
const _Promise = require('any-promise');

const proto = exports;

/**
 * use parallel operations pools
 * @param thunks
 * @param parallel  concurrent number
 * @returns {Promise | Promise<any>}
 * @private
 */
proto._thunkPool = function thunkPool(thunks, parallel) {
  const that = this;

  let _done = 0;
  const _errs = [];

  function checkFinish(thunkArr, resolve) {
    _done++;
    if (_done === thunkArr.length) {
      resolve(_errs);
    }
  }

  function Limiter(concurrency, resolve) {
    const queue = new Queue();
    let endQueueSum = 0;
    function* concurrencyJob() {
      let yieldable;
      while (!that.isCancel()) {
        yieldable = yield queue.next();
        yield yieldable();
      }
      endQueueSum += 1;
      if (endQueueSum === concurrency) {
        queue.fns = [];
        queue.buffer = [];
        resolve(_errs);
      }
    }

    function catchError(err) {
      console.error(err.stack);
    }
    // Create consumers
    for (let i = 0; i < concurrency; i++) {
      co(concurrencyJob).catch(catchError);
    }

    const limit = function (generator, priority) {
      return function (cb) {
        queue.push(function* () {
          try {
            cb(null, yield generator);
          } catch (err) {
            cb(err);
          }
        }, priority);
      };
    };

    return limit;
  }

  return new _Promise(((resolve) => {
    const _limit = new Limiter(parallel, resolve);
    function* job(index) {
      yield _limit(thunks[index]);
      checkFinish(thunks, resolve);
    }

    function catchError(err) {
      _errs.push(err);
      checkFinish(thunks, resolve);
    }
    for (let i = 0; i < thunks.length; i++) {
      co(job(i)).catch(catchError);
    }
  }));
};

/**
 * cancel operation, now can use with multipartUpload
 */
proto.cancel = function () {
  this.options.cancelFlag = true;
};

proto.isCancel = function () {
  return this.options.cancelFlag;
};

proto.resetCancelFlag = function () {
  this.options.cancelFlag = false;
};
