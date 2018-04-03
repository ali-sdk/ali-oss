'use strict';

var co = require('co');
var Queue = require('co-priority-queue');
var proto = exports;

/**
 * use parallel operations pools
 * @param thunks
 * @param parallel  concurrent number
 * @returns {Promise | Promise<any>}
 * @private
 */
proto._thunkPool = function thunkPool(thunks, parallel) {
  var that = this;
  var _Promise = require('any-promise');
  var _done = 0;
  var _errs = [];

  function checkFinish(thunks, resolve) {
    _done++;
    if (_done === thunks.length) {
      resolve(_errs);
    }
  }

  function Limiter(concurrency, resolve) {
    var queue = new Queue();
    var endQueueSum = 0;
    function* concurrencyJob() {
      var yieldable;
      while (!that.isCancel()) {
        yieldable = yield queue.next();
        yield yieldable();
      }
      endQueueSum += 1;
      if (endQueueSum === concurrency) {
        queue.fns = [];
        queue.buffer = [];
        resolve();
      }
    }

    function catchError(err) {
      console.error(err.stack);
    }
    // Create consumers
    for (var i = 0; i < concurrency; i++) {
      co(concurrencyJob).catch(catchError);
    }

    var limit = function(generator, priority) {
      return function(cb) {
        queue.push(function *() {
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

  return new _Promise(function (resolve) {
    var _limit = new Limiter(parallel, resolve);
    function* job() {
      yield _limit(thunks[i]);
      checkFinish(thunks, resolve);
    }

    function catchError(err) {
      _errs.push(err);
      checkFinish(thunks, resolve);
    }
    for (var i = 0; i < thunks.length; i++) {
      co(job).catch(catchError);
    }
  });
};

/**
 * cancel operation, now can use with multipartUpload
 */
proto.cancel = function () {
  this.options.cancelFlag = true;
}

proto.isCancel = function () {
  return this.options.cancelFlag;
}

proto.resetCancelFlag = function () {
  this.options.cancelFlag = false;
}