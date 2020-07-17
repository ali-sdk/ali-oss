import { checkBucketName } from '../utils/checkBucketName';

export function setBucket(this: any, name: string) {
  checkBucketName(name);
  this.options.bucket = name;
  return this;
}
