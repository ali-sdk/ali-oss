/**
 * check Bucket name
 */

exports._checkBucketname = function (name) {
  const bucketRegex = /(^[a-z0-9][a-z0-9-]*[a-z0-9]$)|(^[a-z0-9]$){3,63}/;
  const checkBucket = bucketRegex.test(name);
  return checkBucket;
 };