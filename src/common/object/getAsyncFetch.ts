import { formatObjKey } from '../utils/formatObjKey';
import { RequestOptions } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';

/*
 * getAsyncFetch
 * @param {String} asyncFetch taskId
 * @param {Object} options
 */
export async function getAsyncFetch(this: Client, taskId: string, options: RequestOptions = {}): Promise<object> {
  options.subres = Object.assign({ asyncFetch: '' }, options.subres);
  options.headers = options.headers || {};

  const params = _objectRequestParams.call(this, 'GET', '', options);
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

