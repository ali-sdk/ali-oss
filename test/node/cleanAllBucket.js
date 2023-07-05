const { cleanAllBucket } = require('./utils');
const { oss: config } = require('../config');
const OSS = require('../..');

const store = new OSS(config);

cleanAllBucket(store, 50);

// const interval = new Date().getTime() - 24 * 60 * 60 * 1 * 1000;
// const calculateData = bucket => {
//   return parseInt(bucket.split('-').pop());
// };
