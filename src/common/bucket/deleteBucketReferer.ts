import { checkBucketName } from '../utils/checkBucketName';
import { putBucketReferer } from './putBucketReferer';

export async function deleteBucketReferer(this: any, name, options) {
  checkBucketName(name);
  return await putBucketReferer.call(this, name, true, null, options);
}
