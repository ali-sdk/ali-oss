const { cleanAllBucket } = require('./utils');
const { oss: config } = require('../config');
const OSS = require('../..');

const store = new OSS(config);

cleanAllBucket(store, 50, true);
