export const checkBucketName = (name: string, createBucket = false): void => {
  const bucketRegex = createBucket ? /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/ : /^[a-z0-9_][a-z0-9-_]{1,61}[a-z0-9_]$/;
  if (!bucketRegex.test(name)) {
    throw new Error('The bucket must be conform to the specifications');
  }
};

