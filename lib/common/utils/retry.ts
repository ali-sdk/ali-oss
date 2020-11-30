export function retry(this: any, func: Function, retryMax: number, config: any = {}) {
  let retryNum = 0;
  const { retryDelay = 500, errorHandler = () => true } = config;
  const funcR = (...arg) => {
    return new Promise((resolve, reject) => {
      func(...arg)
        .then(result => {
          retryNum = 0;
          resolve(result);
        })
        .catch(err => {
          if (retryNum < retryMax && errorHandler(err)) {
            retryNum++;
            setTimeout(() => {
              resolve(funcR(...arg));
            }, retryDelay);
          } else {
            retryNum = 0;
            reject(err);
          }
        });
    });
  };

  return funcR;
}
