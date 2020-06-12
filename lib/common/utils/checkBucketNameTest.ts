import { isArray } from './isArray';

export const checkBucketNameTest = (name: string, createBucket: boolean): void => {
  const bucketRegex = createBucket ? /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/ : /^[a-z0-9_][a-z0-9-_]{1,61}[a-z0-9_]$/;
  if (!bucketRegex.test(name)) {
    throw new Error('The bucket must be conform to the specifications');
  }
};
let res = isArray([1, 2, 3]);
console.log(res, 'is array');
res = isArray('');
console.log(res, 'is array');
