const checkBucketName = require('../utils/checkBucketName');

const proto = exports;

proto._checkBucketName = function (name, createBucket) {
  if (!checkBucketName(name, createBucket)) {
    throw new Error('The bucket must be conform to the specifications');
  }
};
