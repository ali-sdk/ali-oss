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
export function queueTask(argList: any[], customFunc: Function, options: queueOptionsType = { retry: 3, limit: 5 }) {
  const opts = Object.assign({}, options);
  const { limit, retry } = opts;
  if (limit > 10) {
    throw new Error('no more than 10 threads');
  }

  let retryCount = 0;

  const queueList: any[] = argList.map(i => () => {
    return new Promise<any>((resolve, reject) => {
      customFunc(i)
        .then(r => resolve(r))
        .catch(err => reject(err));
    });
  });

  const errorList: any[] = [];
  const sucessList: any[] = [];

  const queueRun = () => {
    let status = true;
    if (queueList.length > 0) {
      const task = queueList.pop();
      while (status) {
        task()
          .then(r => {
            sucessList.push(r);
          })
          // eslint-disable-next-line no-loop-func
          .catch(err => {
            if (retryCount < retry) {
              retryCount += 1;
              queueList.unshift(task);
            } else {
              errorList.push(err);
              status = false;
            }
          });
      }
      queueRun();
    }
  };

  // limit customFun
  for (let i = 0; i < limit; i++) {
    // queueRun();
  }

  queueList[0]();

  return {
    sucessList,
    errorList
  };
}
