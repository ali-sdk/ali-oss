import { RequestOptions } from '../../types/params';
import { copy } from './copy';

export async function putMeta(
  this: any,
  name: string,
  meta?: { [props: string]: string },
  options: RequestOptions = {}
) {
  const copyResult = await copy.call(this, name, name, {
    meta: meta || {},
    timeout: options && options.timeout,
    ctx: options && options.ctx
  });
  return copyResult;
}
