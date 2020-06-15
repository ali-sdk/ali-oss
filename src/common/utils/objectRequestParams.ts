import copy from 'copy-to';
import { objectName } from './objectName';

export function objectRequestParams(method, name, bucket, options) {
  if (!bucket) {
    throw new Error('Please create a bucket first');
  }

  options = options || {};
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
