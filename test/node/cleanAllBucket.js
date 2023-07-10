const { cleanAllBucket } = require('./utils');
const { oss: config } = require('../config');
const OSS = require('../..');

// eslint-disable-next-line no-console
console.log('cleanAllBucket...');

const store = new OSS(config);
cleanAllBucket(store, 50, true);
