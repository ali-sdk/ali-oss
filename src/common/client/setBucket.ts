import { Client } from '../../setConfig';
import { checkBucketName } from '../utils/checkBucketName';

export function setBucket(this: Client, name: string) {
  checkBucketName(name);
  this.options.bucket = name;
  return this;
}
