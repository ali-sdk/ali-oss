import { checkBucketName } from '../utils/checkBucketName';
import { putBucketReferer } from './putBucketReferer';
import { RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';

export async function deleteBucketReferer(this: Client, name: string, options: RequestOptions = {}) {
  checkBucketName(name);
  return await putBucketReferer.call(this, name, true, null, options);
}
