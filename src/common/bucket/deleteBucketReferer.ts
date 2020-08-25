import { checkBucketName } from '../utils/checkBucketName';
import { putBucketReferer } from './putBucketReferer';
import { RequestOptions } from '../../types/params';

export async function deleteBucketReferer(this: any, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  return await putBucketReferer.call(this, name, true, null, options);
}
