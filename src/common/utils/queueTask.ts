import { isAsync } from './isAsync';
import { isFunction } from './isFunction';

type queueOptionsType = {
  limit: number;
};

/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options -  limit default5
 */
export function queueTask(this: any, argList: any[], customFunc: Function, options: queueOptionsType = { limit: 5 }) {
  const opts = Object.assign({}, options);
  const { limit } = opts;
  if (limit > 10) {
    throw new Error('no more than 10 threads');
  }

  const isBrowserEnv = process && (process as any).browser;
  const errorList: any[] = [];
  const sucessList: any[] = [];
  const doing: any[] = [];
  const queueList: any[] = argList.map(i => () => {
    return new Promise((resolve, reject) => {
      // browser
      if (isBrowserEnv && isFunction(customFunc)) {
        customFunc
          .apply(this, i)
          .then(r => resolve(r))
          .catch(err => reject(err));
      }
      // node
      if (isAsync(customFunc)) {
        customFunc
          .apply(this, i)
          .then(r => resolve(r))
          .catch(err => reject(err));
      }
    });
  });

  function task() {
    return new Promise(resolve => {
      const queueRun = () => {
        if (!queueList || !queueList.length) {
          return;
        }
        if (queueList.length > 0) {
          const job = queueList.pop();
          doing.push(job);
          job()
            .then(r => {
              sucessList.push(r);
              queueRun();
            })
            .catch(e => errorList.push(e.toString()))
            .then(() => {
              doing.pop();
              if (!doing.length) {
                resolve({
                  sucessList,
                  errorList
                });
              }
            });
        }
      };

      // limit customFun
      for (let i = 0; i < limit; i++) {
        queueRun();
      }
    });
  }

  // const result = await task();
  return task();
}
