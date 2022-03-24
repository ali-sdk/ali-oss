import { isAsync } from './isAsync';

type queueOptionsType = {
  retry: number;
  limit: number;
};

/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options - retry default 3 limit default5
 *
 */
export async function queueTask(
  this: any,
  argList: any[],
  customFunc: Function,
  options: queueOptionsType = { retry: 3, limit: 5 }
) {
  const opts = Object.assign({}, options);
  const { limit, retry } = opts;
  if (limit > 10) {
    throw new Error('no more than 10 threads');
  }

  let retryCount = 0;
  const errorList: any[] = [];
  const sucessList: any[] = [];
  const doing: any[] = [];
  const queueList: any[] = argList.map(i => () => {
    return new Promise<any>(resolve => {
      if (isAsync(customFunc)) {
        resolve(customFunc.apply(this, i));
      } else {
        resolve(customFunc(...i));
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
            .catch(e => {
              if (retryCount < retry) {
                retryCount += 1;
                queueList.unshift(job);
              } else {
                errorList.push(e);
              }
            })
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

  const result = await task();
  return result;
}
