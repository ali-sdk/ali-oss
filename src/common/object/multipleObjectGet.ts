type MultipleObjectGetOptions = {
  parallel: number;
  path: string;
};

export async function multipleObjectGet(this: any, objects: string[], options: MultipleObjectGetOptions) {
  const that = this;
  const defaultPath = process.env.HOME + '/Downloads';
  options = Object.assign({ parallel: 3, path: defaultPath }, options);

  const err = await task();

  if (err && err.length > 0) {
    return err;
  } else return 'ok';

  function task(): Promise<any> {
    return new Promise(resolve => {
      const jobErr: any = [];
      const doing: any = [];
      const jobs = objects.map(_ => {
        return () => {
          return that.get(_, `${options.path}/${_}`);
        };
      });

      for (let i = 0; i < options.parallel && objects && objects.length && !that.isCancel(); i++) {
        continueFn(jobs);
      }

      function continueFn(queue: any[]) {
        if (!queue || !queue.length || that.isCancel()) {
          return;
        }
        const item = queue.pop();
        doing.push(item);
        item()
          .then(_res => {
            continueFn(queue);
          })
          .catch(_err => {
            queue.length = 0;
            jobErr.push(_err);
            resolve(jobErr);
          })
          .then(() => {
            doing.pop();
            if (!doing.length) resolve();
          });
      }
    });
  }
}
