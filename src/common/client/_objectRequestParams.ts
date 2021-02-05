import copy from 'copy-to';
import { Client } from '../../setConfig';
import { objectName } from '../utils/objectName';

export function _objectRequestParams(this: Client, method, name, options: any = {}) {
  const { bucket } = this.options;
  if (!bucket && !this.options.cname) {
    throw new Error('Please create a bucket first');
  }

  name = objectName(name);
  const params: any = {
    object: name,
    bucket,
    method,
    subres: options && options.subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx
  };

  if (options.headers) {
    params.headers = {};
    copy(options.headers).to(params.headers);
  }
  return params;
}
