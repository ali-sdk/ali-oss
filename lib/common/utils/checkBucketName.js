/**
 * check Bucket Name
 */

module.exports = function (name) {
  const bucketRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
  const checkBucket = bucketRegex.test(name);
  return checkBucket;
};
