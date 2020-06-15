import { formatObjKey } from '../utils/formatObjKey';

/*
 * getAsyncFetch
 * @param {String} asyncFetch taskId
 * @param {Object} options
 */
export async function getAsyncFetch(this: any, taskId, options: any = {}): Promise<object> {
  options.subres = Object.assign({ asyncFetch: '' }, options.subres);
  options.headers = options.headers || {};

  const params = this._objectRequestParams('GET', '', options);
  params.headers['x-oss-task-id'] = taskId;
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = await this.request(params);
  const taskInfo = formatObjKey(result.data.TaskInfo, 'firstLowerCase');
  return {
    res: result.res,
    status: result.status,
    state: result.data.State,
    taskInfo
  };
}

