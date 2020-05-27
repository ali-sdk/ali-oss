export default function _parallel(client, todo, parallel, jobPromise) {
  return new Promise((resolve) => {
    const _jobErr = [];
    if (parallel <= 0 || !todo) {
      resolve(_jobErr);
      return;
    }

    function onlyOnce(fn) {
      return (...args) => {
        if (fn === null) throw new Error('Callback was already called.');
        const callFn = fn;
        fn = null;
        callFn.apply(client, args);
      };
    }

    function createArrayIterator(coll) {
      let i = -1;
      const len = coll.length;
      return function next() {
        return (++i < len && !client.options.cancelFlag) ? { value: coll[i], key: i } : null;
      };
    }

    const nextElem = createArrayIterator(todo);
    let done = false;
    let running = 0;
    let looping = false;

    function iterateeCallback(err, value) {
      running -= 1;
      if (err) {
        done = true;
        _jobErr.push(err);
        resolve(_jobErr);
      } else if (value === {} || (done && running <= 0)) {
        done = true;
        resolve(_jobErr);
      } else if (!looping) {
        /* eslint no-use-before-define: [0] */
        if (client.options.cancelFlag) {
          resolve(_jobErr);
        } else {
          replenish();
        }
      }
    }

    function iteratee(value, callback) {
      jobPromise(value).then((result) => {
        callback(null, result);
      }).catch((err) => {
        callback(err);
      });
    }

    function replenish() {
      looping = true;
      while (running < parallel && !done && !client.options.cancelFlag) {
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
}
