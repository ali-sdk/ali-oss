/**
 * check Bucket Name
 */

module.exports = function (name, createBucket) {
  const bucketRegex = createBucket ? /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/ : /^[a-z0-9_][a-z0-9-_]{1,61}[a-z0-9_]$/;
  const checkBucket = bucketRegex.test(name);
  return checkBucket;
};
